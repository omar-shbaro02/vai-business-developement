import { randomUUID } from "node:crypto";
import {
  transition,
  type Confidence,
  type Freshness,
  type VerificationStatus,
} from "@vai/domain";
import type { Pool, PoolClient } from "pg";

export interface CreateEvidenceInput {
  origin: "SOURCE";
  tenantId: string;
  organizationId: string;
  opportunityId: string | null;
  sourceType: "MANUAL" | "CSV_IMPORT" | "APPROVED_CONNECTOR";
  sourceReference: string | null;
  sourceRecordId: string | null;
  importId: string | null;
  capturedAt: string;
  observedAt: string | null;
  evidenceType: string;
  rawValue: unknown;
  normalizedValue: unknown | null;
  confidence: Confidence;
  freshness: Freshness;
  actorId: string;
  requestId: string;
  supersedesEvidenceId?: string | null;
}

export interface EvidenceReviewCommand {
  tenantId: string;
  evidenceId: string;
  actorId: string;
  requestId: string;
  reason: string;
}

type EvidenceState = {
  id: string;
  verification_status: VerificationStatus;
  freshness: Freshness;
};

export class EvidenceStore {
  constructor(private readonly pool: Pool) {}

  async create(input: CreateEvidenceInput): Promise<string> {
    validateEvidenceInput(input);
    return this.transaction(async (client) =>
      this.insertEvidence(client, input),
    );
  }

  async review(command: EvidenceReviewCommand): Promise<void> {
    await this.changeVerification(command, "REVIEWED");
  }

  async verify(command: EvidenceReviewCommand): Promise<void> {
    await this.changeVerification(command, "VERIFIED");
  }

  async reject(command: EvidenceReviewCommand): Promise<void> {
    await this.changeVerification(command, "REJECTED");
  }

  async markStale(command: EvidenceReviewCommand): Promise<void> {
    if (!command.reason.trim())
      throw new Error("Freshness change requires a reason");
    await this.transaction(async (client) => {
      const evidence = await this.lockEvidence(client, command);
      if (evidence.freshness === "STALE")
        throw new Error("Evidence is already stale");
      await client.query(
        "update evidence_items set freshness='STALE', updated_at=now() where id=$1 and tenant_id=$2",
        [command.evidenceId, command.tenantId],
      );
      await this.audit(
        client,
        command,
        "EVIDENCE_MARKED_STALE",
        { freshness: evidence.freshness },
        { freshness: "STALE" },
      );
    });
  }

  async supersede(
    input: CreateEvidenceInput & { supersedesEvidenceId: string },
  ): Promise<string> {
    validateEvidenceInput(input);
    if (!input.supersedesEvidenceId)
      throw new Error("Superseded evidence ID is required");
    return this.transaction(async (client) => {
      const previous = await this.lockEvidence(client, {
        tenantId: input.tenantId,
        evidenceId: input.supersedesEvidenceId,
        actorId: input.actorId,
        requestId: input.requestId,
        reason: "Superseded by corrected evidence",
      });
      const id = await this.insertEvidence(client, input);
      if (previous.freshness !== "STALE")
        await client.query(
          "update evidence_items set freshness='STALE', updated_at=now() where id=$1 and tenant_id=$2",
          [input.supersedesEvidenceId, input.tenantId],
        );
      return id;
    });
  }

  private async changeVerification(
    command: EvidenceReviewCommand,
    target: VerificationStatus,
  ): Promise<void> {
    if (!command.reason.trim())
      throw new Error("Evidence review requires a reason");
    await this.transaction(async (client) => {
      const evidence = await this.lockEvidence(client, command);
      transition(
        {
          lifecycle: "EVIDENCE",
          from: evidence.verification_status,
          to: target,
          actorId: command.actorId,
          occurredAt: new Date().toISOString(),
          reason: command.reason,
        },
        randomUUID(),
      );
      await client.query(
        "update evidence_items set verification_status=$1, review_notes=$2, updated_at=now() where id=$3 and tenant_id=$4",
        [target, command.reason, command.evidenceId, command.tenantId],
      );
      await this.audit(
        client,
        command,
        `EVIDENCE_${target}`,
        { verificationStatus: evidence.verification_status },
        { verificationStatus: target },
      );
    });
  }

  private async insertEvidence(
    client: PoolClient,
    input: CreateEvidenceInput,
  ): Promise<string> {
    const id = randomUUID();
    await client.query(
      `insert into evidence_items
       (id,tenant_id,organization_id,opportunity_id,source_type,source_reference,source_record_id,import_id,captured_at,observed_at,evidence_type,raw_value,normalized_value,confidence,freshness,verification_status,created_by,supersedes_evidence_id)
       values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12::jsonb,$13::jsonb,$14,$15,'RAW',$16,$17)`,
      [
        id,
        input.tenantId,
        input.organizationId,
        input.opportunityId,
        input.sourceType,
        input.sourceReference,
        input.sourceRecordId,
        input.importId,
        input.capturedAt,
        input.observedAt,
        input.evidenceType,
        JSON.stringify(input.rawValue),
        input.normalizedValue === null
          ? null
          : JSON.stringify(input.normalizedValue),
        input.confidence,
        input.freshness,
        input.actorId,
        input.supersedesEvidenceId ?? null,
      ],
    );
    await this.audit(
      client,
      {
        tenantId: input.tenantId,
        evidenceId: id,
        actorId: input.actorId,
        requestId: input.requestId,
        reason: "Evidence captured",
      },
      "EVIDENCE_CAPTURED",
      null,
      {
        sourceType: input.sourceType,
        capturedAt: input.capturedAt,
        observedAt: input.observedAt,
      },
    );
    return id;
  }

  private async lockEvidence(
    client: PoolClient,
    command: EvidenceReviewCommand,
  ): Promise<EvidenceState> {
    const result = await client.query<EvidenceState>(
      "select id,verification_status,freshness from evidence_items where id=$1 and tenant_id=$2 for update",
      [command.evidenceId, command.tenantId],
    );
    const evidence = result.rows[0];
    if (!evidence) throw new Error("Evidence not found in tenant");
    return evidence;
  }

  private async audit(
    client: PoolClient,
    command: EvidenceReviewCommand,
    action: string,
    before: unknown,
    after: unknown,
  ): Promise<void> {
    await client.query(
      `insert into audit_events (tenant_id,actor_id,action,resource_type,resource_id,occurred_at,request_id,reason,before,after)
       values ($1,$2,$3,'evidence',$4,now(),$5,$6,$7::jsonb,$8::jsonb)`,
      [
        command.tenantId,
        command.actorId,
        action,
        command.evidenceId,
        command.requestId,
        command.reason,
        before === null ? null : JSON.stringify(before),
        after === null ? null : JSON.stringify(after),
      ],
    );
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

function validateEvidenceInput(input: CreateEvidenceInput): void {
  if (input.origin !== "SOURCE")
    throw new Error("AI inference cannot be stored as evidence");
  if (!input.evidenceType.trim()) throw new Error("Evidence type is required");
  if (!Number.isFinite(Date.parse(input.capturedAt)))
    throw new Error("Valid capture time is required");
  if (input.observedAt && !Number.isFinite(Date.parse(input.observedAt)))
    throw new Error("Observed time must be valid when supplied");
  if (
    input.observedAt &&
    Date.parse(input.observedAt) > Date.parse(input.capturedAt)
  )
    throw new Error("Observed time cannot be after capture time");
  if (input.sourceType === "CSV_IMPORT" && !input.importId)
    throw new Error("CSV evidence requires an import ID");
  if (
    input.sourceType === "APPROVED_CONNECTOR" &&
    (!input.sourceReference || !input.sourceRecordId)
  )
    throw new Error("Connector evidence requires source and record references");
  if (input.rawValue === undefined)
    throw new Error("Raw evidence value is required");
}
