import { randomUUID } from "node:crypto";
import type {
  DiscoveryError,
  DiscoveryRecord,
  ImportContext,
  ImportSink,
} from "@vai/discovery";
import type { Pool } from "pg";

export class DiscoveryImportStore implements ImportSink {
  constructor(private readonly pool: Pool) {}

  async start(context: ImportContext): Promise<string> {
    const id = randomUUID();
    await this.pool.query(
      `insert into discovery_imports
       (id,tenant_id,status,filename,source_reference,raw_storage_reference,cleanup_after,permission_attested,attestation_text,created_by)
       values ($1,$2,'PROCESSING',$3,$4,$5,$6,true,$7,$8)`,
      [
        id,
        context.tenantId,
        context.filename,
        context.sourceReference,
        context.rawStorageReference,
        context.cleanupAfter,
        context.attestationText,
        context.actorId,
      ],
    );
    return id;
  }

  async accept(
    importId: string,
    record: DiscoveryRecord,
  ): Promise<"ACCEPTED" | "DUPLICATE"> {
    const result = await this.pool.query(
      `insert into discovery_records
       (tenant_id,import_id,source_type,source_reference,source_record_id,legal_name,display_name,website,domain,raw_record,captured_at,created_by)
       select tenant_id,id,$2,$3,$4,$5,$6,$7,$8,$9::jsonb,$10,created_by from discovery_imports where id=$1
       on conflict (tenant_id,source_type,source_reference,source_record_id) do nothing returning id`,
      [
        importId,
        record.sourceType,
        record.sourceReference,
        record.sourceRecordId,
        record.legalName,
        record.displayName,
        record.website,
        record.domain,
        JSON.stringify(record.rawRecord),
        record.capturedAt,
      ],
    );
    return result.rowCount === 1 ? "ACCEPTED" : "DUPLICATE";
  }

  async reject(importId: string, error: DiscoveryError): Promise<void> {
    await this.pool.query(
      "insert into discovery_import_errors (import_id,row_number,field,code,message) values ($1,$2,$3,$4,$5)",
      [importId, error.row, error.field, error.code, error.message],
    );
  }

  async finish(
    importId: string,
    counts: {
      rows: number;
      accepted: number;
      rejected: number;
      duplicates: number;
    },
  ): Promise<void> {
    const status = counts.rejected ? "COMPLETED_WITH_ERRORS" : "COMPLETED";
    await this.pool.query(
      `update discovery_imports set status=$1,row_count=$2,accepted_count=$3,rejected_count=$4,
       duplicate_candidate_count=$5,completed_at=now(),updated_at=now() where id=$6`,
      [
        status,
        counts.rows,
        counts.accepted,
        counts.rejected,
        counts.duplicates,
        importId,
      ],
    );
  }

  async fail(importId: string, safeMessage: string): Promise<void> {
    void safeMessage;
    await this.pool.query(
      "update discovery_imports set status='FAILED',completed_at=now(),updated_at=now() where id=$1",
      [importId],
    );
  }

  async rawImportsDueForCleanup(
    now: Date,
  ): Promise<Array<{ id: string; raw_storage_reference: string }>> {
    const result = await this.pool.query<{
      id: string;
      raw_storage_reference: string;
    }>(
      `select id,raw_storage_reference from discovery_imports where raw_storage_reference is not null
       and cleanup_after is not null and cleanup_after <= $1 and status in ('COMPLETED','COMPLETED_WITH_ERRORS','FAILED')`,
      [now.toISOString()],
    );
    return result.rows;
  }

  async confirmRawCleanup(importId: string): Promise<void> {
    await this.pool.query(
      "update discovery_imports set raw_storage_reference=null,updated_at=now() where id=$1",
      [importId],
    );
  }
}
