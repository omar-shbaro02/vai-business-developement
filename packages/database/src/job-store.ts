import { randomUUID } from "node:crypto";
import type { Pool, PoolClient } from "pg";

export interface EnqueueJob {
  tenantId: string;
  type: string;
  payload: unknown;
  idempotencyKey: string;
  maxAttempts?: number;
}
export type JobRow = {
  id: string;
  tenant_id: string;
  type: string;
  payload: unknown;
  attempts: number;
  max_attempts: number;
};

export class JobOutboxStore {
  constructor(private readonly pool: Pool) {}

  async writeWithJob<T>(
    write: (client: PoolClient) => Promise<T>,
    job: EnqueueJob,
  ): Promise<{ result: T; jobId: string }> {
    return this.transaction(async (client) => {
      const result = await write(client);
      const jobId = await this.enqueueWithClient(client, job);
      return { result, jobId };
    });
  }

  async enqueue(job: EnqueueJob): Promise<string> {
    return this.transaction((client) => this.enqueueWithClient(client, job));
  }

  async claim(workerId: string): Promise<JobRow | null> {
    return this.transaction(async (client) => {
      const result = await client.query<JobRow>(
        `with candidate as (
           select id from background_jobs where status='PENDING' and available_at <= now()
           order by available_at,created_at for update skip locked limit 1
         ) update background_jobs j set status='PROCESSING',locked_at=now(),locked_by=$1,updated_at=now()
         from candidate where j.id=candidate.id returning j.id,j.tenant_id,j.type,j.payload,j.attempts,j.max_attempts`,
        [workerId],
      );
      return result.rows[0] ?? null;
    });
  }

  async complete(jobId: string, workerId: string): Promise<void> {
    const result = await this.pool.query(
      "update background_jobs set status='COMPLETED',completed_at=now(),locked_at=null,locked_by=null,updated_at=now() where id=$1 and status='PROCESSING' and locked_by=$2",
      [jobId, workerId],
    );
    if (result.rowCount !== 1) throw new Error("Claimed job not found");
  }

  async fail(
    jobId: string,
    workerId: string,
    safeError: string,
  ): Promise<"PENDING" | "DEAD_LETTER"> {
    const result = await this.pool.query<{ status: "PENDING" | "DEAD_LETTER" }>(
      `update background_jobs set attempts=attempts+1,
       status=case when attempts+1 >= max_attempts then 'DEAD_LETTER'::job_status else 'PENDING'::job_status end,
       available_at=case when attempts+1 >= max_attempts then available_at else now() + make_interval(secs => least(300, power(2,attempts+1)::int)) end,
       locked_at=null,locked_by=null,last_error=$3,updated_at=now()
       where id=$1 and status='PROCESSING' and locked_by=$2 returning status`,
      [jobId, workerId, safeError.slice(0, 500)],
    );
    const row = result.rows[0];
    if (!row) throw new Error("Claimed job not found");
    return row.status;
  }

  async recoverAbandoned(olderThan: Date): Promise<number> {
    const result = await this.pool.query(
      "update background_jobs set status='PENDING',locked_at=null,locked_by=null,available_at=now(),updated_at=now() where status='PROCESSING' and locked_at < $1",
      [olderThan.toISOString()],
    );
    return result.rowCount ?? 0;
  }

  private async enqueueWithClient(
    client: PoolClient,
    job: EnqueueJob,
  ): Promise<string> {
    if (!job.idempotencyKey.trim())
      throw new Error("Idempotency key is required");
    const id = randomUUID();
    const result = await client.query<{ id: string }>(
      `insert into background_jobs (id,tenant_id,type,payload,idempotency_key,max_attempts)
       values ($1,$2,$3,$4::jsonb,$5,$6) on conflict (tenant_id,idempotency_key)
       do update set idempotency_key=excluded.idempotency_key returning id`,
      [
        id,
        job.tenantId,
        job.type,
        JSON.stringify(job.payload),
        job.idempotencyKey,
        job.maxAttempts ?? 3,
      ],
    );
    const jobId = result.rows[0]!.id;
    await client.query(
      `insert into outbox_events (tenant_id,topic,aggregate_type,aggregate_id,payload,idempotency_key)
       values ($1,'job.requested','background_job',$2,$3::jsonb,$4)
       on conflict (tenant_id,idempotency_key) do nothing`,
      [
        job.tenantId,
        jobId,
        JSON.stringify({ jobId, type: job.type }),
        `job:${job.idempotencyKey}`,
      ],
    );
    return jobId;
  }

  private async transaction<T>(
    operation: (client: PoolClient) => Promise<T>,
  ): Promise<T> {
    const client = await this.pool.connect();
    try {
      await client.query("begin");
      const result = await operation(client);
      await client.query("commit");
      return result;
    } catch (error) {
      await client.query("rollback");
      throw error;
    } finally {
      client.release();
    }
  }
}
