import { Readable } from "node:stream";
import { describe, expect, it } from "vitest";
import {
  CsvSourceAdapter,
  runImport,
  type DiscoveryError,
  type DiscoveryRecord,
  type ImportSink,
} from "./index.js";

class MemorySink implements ImportSink {
  context: unknown;
  records: DiscoveryRecord[] = [];
  errors: DiscoveryError[] = [];
  failed = false;
  finished: unknown;
  async start(context: unknown) {
    this.context = context;
    return "import-1";
  }
  async accept(_id: string, record: DiscoveryRecord) {
    if (
      this.records.some(
        (existing) =>
          existing.sourceReference === record.sourceReference &&
          existing.sourceRecordId === record.sourceRecordId,
      )
    )
      return "DUPLICATE" as const;
    this.records.push(record);
    return "ACCEPTED" as const;
  }
  async reject(_id: string, error: DiscoveryError) {
    this.errors.push(error);
  }
  async finish(_id: string, counts: unknown) {
    this.finished = counts;
  }
  async fail() {
    this.failed = true;
  }
}

describe("discovery adapters", () => {
  it("streams valid CSV rows, reports invalid rows, retains provenance, and counts duplicates", async () => {
    const sink = new MemorySink();
    const csv =
      "source_record_id,legal_name,display_name,website\n1,Example LLC,Example,https://example.com\n2,,,bad url\n1,Example LLC,Example,https://example.com\n";
    const result = await runImport(
      new CsvSourceAdapter(),
      { stream: Readable.from(csv), capturedAt: "2026-08-31T10:00:00Z" },
      {
        tenantId: "tenant",
        filename: "accounts.csv",
        sourceReference: "upload/accounts.csv",
        rawStorageReference: "raw/import-1",
        cleanupAfter: "2026-09-30T10:00:00Z",
        permissionAttested: true,
        attestationText: "Approved business use",
        actorId: "actor",
      },
      sink,
    );
    expect(result).toMatchObject({
      rows: 3,
      accepted: 1,
      rejected: 1,
      duplicates: 1,
    });
    expect(sink.records[0]).toMatchObject({
      sourceType: "CSV_IMPORT",
      sourceReference: "upload/accounts.csv",
      sourceRecordId: "1",
      domain: "example.com",
    });
    expect(sink.errors[0]).toMatchObject({
      row: 3,
      field: "legal_name",
      code: "REQUIRED",
    });
    expect(sink.context).toMatchObject({
      permissionAttested: true,
      rawStorageReference: "raw/import-1",
      cleanupAfter: "2026-09-30T10:00:00Z",
    });
  });

  it("isolates adapter failures behind a safe source error", async () => {
    const sink = new MemorySink();
    const adapter = {
      sourceType: "CSV_IMPORT" as const,
      async *discover() {
        yield* [];
        throw new Error("secret provider failure");
      },
    };
    await expect(
      runImport(
        adapter,
        { stream: Readable.from(""), capturedAt: new Date().toISOString() },
        {
          tenantId: "tenant",
          filename: "bad.csv",
          sourceReference: "upload/bad.csv",
          rawStorageReference: null,
          cleanupAfter: null,
          permissionAttested: true,
          attestationText: "Approved",
          actorId: "actor",
        },
        sink,
      ),
    ).rejects.toThrow("Discovery source failed");
    expect(sink.failed).toBe(true);
  });
});
