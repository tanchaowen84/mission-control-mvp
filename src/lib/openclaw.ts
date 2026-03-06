import { NextResponse } from "next/server";

const DEFAULT_PREFIX = "/api";
const DEFAULT_TIMEOUT_MS = 15_000;

export type OpenClawRequestOptions = {
  body?: unknown;
  method?: string;
  path: string;
  request?: Request;
  forwardSearchParams?: boolean;
};

type OpenClawResponse = {
  data: unknown;
  status: number;
};

function cleanBaseUrl() {
  const raw = process.env.OPENCLAW_API_URL?.trim();
  if (!raw) return null;
  return raw.endsWith("/") ? raw.slice(0, -1) : raw;
}

function cleanPrefix() {
  const raw = process.env.OPENCLAW_API_PREFIX?.trim();
  if (!raw) return DEFAULT_PREFIX;

  const withoutTrailing = raw.replace(/\/+$/, "") || "/";
  return withoutTrailing.startsWith("/") ? withoutTrailing : `/${withoutTrailing}`;
}

function timeoutMs() {
  const parsed = Number.parseInt(process.env.OPENCLAW_TIMEOUT_MS ?? "", 10);
  if (Number.isFinite(parsed) && parsed > 0) {
    return parsed;
  }
  return DEFAULT_TIMEOUT_MS;
}

function buildTargetUrl(path: string, request?: Request, forwardSearchParams = true) {
  const base = cleanBaseUrl();
  if (!base) {
    throw new Error("OPENCLAW_API_URL is not configured");
  }

  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  const prefix = cleanPrefix();
  const combinedPath = `${prefix === "/" ? "" : prefix}${normalizedPath}`;
  const target = new URL(combinedPath, `${base}/`);

  if (request && forwardSearchParams) {
    const incoming = new URL(request.url);
    target.search = incoming.search;
  }

  return target;
}

function buildHeaders(hasBody: boolean) {
  const headers = new Headers({ Accept: "application/json" });

  if (hasBody) {
    headers.set("Content-Type", "application/json");
  }

  const apiKey = process.env.OPENCLAW_API_KEY?.trim();
  if (apiKey) {
    headers.set("Authorization", `Bearer ${apiKey}`);
  }

  return headers;
}

async function parseResponseBody(response: Response): Promise<unknown> {
  const text = await response.text();
  if (!text) {
    return null;
  }

  try {
    return JSON.parse(text);
  } catch {
    return { message: text };
  }
}

export function isOpenClawEnabled() {
  return Boolean(cleanBaseUrl());
}

export async function requestOpenClaw(options: OpenClawRequestOptions): Promise<OpenClawResponse | null> {
  if (!isOpenClawEnabled()) {
    return null;
  }

  const { body, method, path, request, forwardSearchParams } = options;
  const target = buildTargetUrl(path, request, forwardSearchParams);
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs());

  try {
    const response = await fetch(target, {
      method: method ?? request?.method ?? "GET",
      headers: buildHeaders(body !== undefined),
      body: body === undefined ? undefined : JSON.stringify(body),
      cache: "no-store",
      signal: controller.signal,
    });

    const data = await parseResponseBody(response);
    return { data, status: response.status };
  } finally {
    clearTimeout(timer);
  }
}

export async function proxyOpenClaw(options: OpenClawRequestOptions): Promise<NextResponse | null> {
  try {
    const result = await requestOpenClaw(options);

    if (!result) {
      return null;
    }

    if (result.data === null) {
      return new NextResponse(null, { status: result.status });
    }

    return NextResponse.json(result.data, { status: result.status });
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      return NextResponse.json({ error: "OpenClaw upstream timeout" }, { status: 504 });
    }

    return NextResponse.json(
      {
        error: "OpenClaw upstream request failed",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 502 },
    );
  }
}
