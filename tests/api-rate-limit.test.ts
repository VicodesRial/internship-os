import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getUser: vi.fn(),
  rpc: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(async () => ({
    auth: { getUser: mocks.getUser },
    rpc: mocks.rpc,
  })),
}));

import { enforceRateLimit } from "@/lib/api/server";

const request = () => new Request("http://localhost:3000/api/applications");

beforeEach(() => {
  mocks.getUser.mockReset();
  mocks.rpc.mockReset();
  mocks.getUser.mockResolvedValue({
    data: { user: { id: "10000000-0000-4000-8000-000000000001" } },
  });
});

describe("authenticated API rate limits", () => {
  it("allows requests with remaining capacity", async () => {
    mocks.rpc.mockResolvedValue({
      data: [{
        allowed: true,
        remaining: 59,
        request_limit: 60,
        retry_after_seconds: 60,
      }],
      error: null,
    });

    await expect(enforceRateLimit(request(), "normal")).resolves.toBeNull();
    expect(mocks.rpc).toHaveBeenCalledWith("consume_api_rate_limit", {
      p_scope: "normal",
    });
  });

  it("returns 429 and Retry-After when the database limit is exhausted", async () => {
    mocks.rpc.mockResolvedValue({
      data: [{
        allowed: false,
        remaining: 0,
        request_limit: 10,
        retry_after_seconds: 120,
      }],
      error: null,
    });

    const response = await enforceRateLimit(request(), "sensitive");
    const body = await response?.json();

    expect(response?.status).toBe(429);
    expect(response?.headers.get("retry-after")).toBe("120");
    expect(body.error.code).toBe("RATE_LIMITED");
  });

  it("returns 401 when authentication has expired", async () => {
    mocks.getUser.mockResolvedValue({ data: { user: null } });

    const response = await enforceRateLimit(request(), "normal");

    expect(response?.status).toBe(401);
    expect(mocks.rpc).not.toHaveBeenCalled();
  });

  it("maps RPC failures to a generic 500 without database details", async () => {
    mocks.rpc.mockResolvedValue({
      data: null,
      error: { message: "relation public.api_rate_limits does not exist" },
    });

    const response = await enforceRateLimit(request(), "normal");
    const body = await response?.json();

    expect(response?.status).toBe(500);
    expect(JSON.stringify(body)).not.toContain("api_rate_limits");
    expect(body.error.code).toBe("INTERNAL_ERROR");
  });
});
