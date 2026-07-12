"use client";

import type { DataResult } from "@/lib/data/applications";
import type { ModuleResource } from "@/lib/data/modules";
import type { NetworkingContact, TargetCompany, WeeklyGoal } from "@/lib/types";

export type ModuleRecord = NetworkingContact | TargetCompany | WeeklyGoal;

async function send<T>(method: "DELETE" | "POST" | "PUT", body: unknown, fallback: string): Promise<DataResult<T>> {
  try {
    const response = await fetch("/api/modules", {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const result = await response.json() as DataResult<T>;
    return result.error || result.data !== null ? result : { data: null, error: fallback };
  } catch { return { data: null, error: fallback }; }
}

export function createModuleRequest(resource: ModuleResource, record: ModuleRecord) {
  return send<ModuleRecord>("POST", { resource, record }, "Unable to create this record.");
}

export function updateModuleRequest(resource: ModuleResource, record: ModuleRecord) {
  return send<ModuleRecord>("PUT", { resource, record }, "Unable to update this record.");
}

export function deleteModuleRequest(resource: ModuleResource, id: string) {
  return send<true>("DELETE", { resource, id }, "Unable to delete this record.");
}

export function updateProfileRequest(displayName: string) {
  return send<string>("PUT", { resource: "profile", displayName }, "Unable to update your profile.");
}
