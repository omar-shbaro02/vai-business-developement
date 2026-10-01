import {
  prospectSearchRequestSchema,
  prospectSearchResponseSchema,
} from "@vai/contracts";
import { NextResponse } from "next/server";

const apiBaseUrl = process.env.API_BASE_URL ?? "http://127.0.0.1:4000";

export async function POST(request: Request) {
  const parsed = prospectSearchRequestSchema.safeParse(await request.json());
  if (!parsed.success)
    return NextResponse.json(
      {
        error: {
          code: "VALIDATION_ERROR",
          message: "Industry and region are required",
          details: parsed.error.issues,
        },
      },
      { status: 400 },
    );

  try {
    const response = await fetch(`${apiBaseUrl}/v1/prospect-search`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(parsed.data),
      cache: "no-store",
      signal: AbortSignal.timeout(15_000),
    });
    const body: unknown = await response.json();
    if (!response.ok)
      return NextResponse.json(body, { status: response.status });
    const result = prospectSearchResponseSchema.safeParse(body);
    if (!result.success)
      return NextResponse.json(
        {
          error: {
            code: "INVALID_UPSTREAM_RESPONSE",
            message: "The prospect service returned an invalid response",
          },
        },
        { status: 502 },
      );
    return NextResponse.json(result.data);
  } catch {
    return NextResponse.json(
      {
        error: {
          code: "SERVICE_UNAVAILABLE",
          message: "Prospect search is temporarily unavailable",
        },
      },
      { status: 503 },
    );
  }
}
