import type { Readable } from "node:stream";
import { parse } from "csv-parse";

export type SourceType = "MANUAL" | "CSV_IMPORT" | "APPROVED_CONNECTOR";
export interface DiscoveryRecord {
  sourceType: SourceType;
  sourceReference: string;
  sourceRecordId: string;
  capturedAt: string;
  legalName: string;
  displayName: string;
  website: string | null;
  domain: string | null;
  rawRecord: unknown;
}
export interface DiscoveryError {
  row: number;
  field: string | null;
  code: string;
  message: string;
}
export type DiscoveryResult =
  { ok: true; record: DiscoveryRecord } | { ok: false; error: DiscoveryError };
export interface SourceAdapter<Input> {
  readonly sourceType: SourceType;
  discover(input: Input): AsyncIterable<DiscoveryResult>;
}

export interface ImportContext {
  tenantId: string;
  filename: string;
  sourceReference: string;
  rawStorageReference: string | null;
  cleanupAfter: string | null;
  permissionAttested: true;
  attestationText: string;
  actorId: string;
}
export interface ImportSink {
  start(context: ImportContext): Promise<string>;
  accept(
    importId: string,
    record: DiscoveryRecord,
  ): Promise<"ACCEPTED" | "DUPLICATE">;
  reject(importId: string, error: DiscoveryError): Promise<void>;
  finish(
    importId: string,
    counts: {
      rows: number;
      accepted: number;
      rejected: number;
      duplicates: number;
    },
  ): Promise<void>;
  fail(importId: string, safeMessage: string): Promise<void>;
}

export class ManualSourceAdapter implements SourceAdapter<
  Omit<DiscoveryRecord, "sourceType">
> {
  readonly sourceType = "MANUAL" as const;
  async *discover(
    input: Omit<DiscoveryRecord, "sourceType">,
  ): AsyncIterable<DiscoveryResult> {
    const error = validate(input, 1);
    if (error) yield { ok: false, error };
    else yield { ok: true, record: { ...input, sourceType: this.sourceType } };
  }
}

export class CsvSourceAdapter implements SourceAdapter<{
  stream: Readable;
  sourceReference: string;
  capturedAt: string;
}> {
  readonly sourceType = "CSV_IMPORT" as const;
  async *discover(input: {
    stream: Readable;
    sourceReference: string;
    capturedAt: string;
  }): AsyncIterable<DiscoveryResult> {
    const parser = input.stream.pipe(
      parse({
        columns: true,
        bom: true,
        trim: true,
        skip_empty_lines: true,
        relax_column_count: true,
      }),
    );
    let row = 1;
    try {
      for await (const raw of parser) {
        row += 1;
        const value = raw as Record<string, string>;
        const record: DiscoveryRecord = {
          sourceType: this.sourceType,
          sourceReference: input.sourceReference,
          sourceRecordId: value.source_record_id || `row-${row}`,
          capturedAt: input.capturedAt,
          legalName: value.legal_name ?? "",
          displayName: value.display_name || value.legal_name || "",
          website: value.website || null,
          domain: normalizeOptionalDomain(
            value.domain || value.website || null,
          ),
          rawRecord: value,
        };
        const error = validate(record, row);
        yield error ? { ok: false, error } : { ok: true, record };
      }
    } catch {
      yield {
        ok: false,
        error: {
          row,
          field: null,
          code: "INVALID_CSV",
          message: "CSV content could not be parsed",
        },
      };
    }
  }
}

export async function runImport(
  adapter: SourceAdapter<{
    stream: Readable;
    sourceReference: string;
    capturedAt: string;
  }>,
  input: { stream: Readable; capturedAt: string },
  context: ImportContext,
  sink: ImportSink,
) {
  if (!context.permissionAttested || !context.attestationText.trim())
    throw new Error("Importer permission attestation is required");
  const importId = await sink.start(context);
  const counts = { rows: 0, accepted: 0, rejected: 0, duplicates: 0 };
  try {
    for await (const result of adapter.discover({
      ...input,
      sourceReference: context.sourceReference,
    })) {
      counts.rows += 1;
      if (!result.ok) {
        counts.rejected += 1;
        await sink.reject(importId, result.error);
        continue;
      }
      const outcome = await sink.accept(importId, result.record);
      if (outcome === "ACCEPTED") counts.accepted += 1;
      else counts.duplicates += 1;
    }
    await sink.finish(importId, counts);
    return { importId, ...counts };
  } catch {
    await sink.fail(importId, "Discovery source failed");
    throw new Error("Discovery source failed");
  }
}

function validate(
  record: Pick<
    DiscoveryRecord,
    "legalName" | "website" | "sourceReference" | "sourceRecordId"
  >,
  row: number,
): DiscoveryError | null {
  if (!record.legalName.trim())
    return {
      row,
      field: "legal_name",
      code: "REQUIRED",
      message: "Legal name is required",
    };
  if (!record.sourceReference || !record.sourceRecordId)
    return {
      row,
      field: "source",
      code: "MISSING_PROVENANCE",
      message: "Source reference and record ID are required",
    };
  if (record.website) {
    try {
      new URL(
        record.website.startsWith("http")
          ? record.website
          : `https://${record.website}`,
      );
    } catch {
      return {
        row,
        field: "website",
        code: "INVALID_URL",
        message: "Website must be a valid URL",
      };
    }
  }
  return null;
}

function normalizeOptionalDomain(value: string | null): string | null {
  if (!value) return null;
  try {
    const url = new URL(value.startsWith("http") ? value : `https://${value}`);
    return url.hostname.toLowerCase().replace(/^www\./, "");
  } catch {
    return null;
  }
}
