"use client";

import type { DataResult } from "@/lib/data/applications";
import type { Application, ApplicationStatus } from "@/lib/types";
import { apiFetch, parseApiResponse } from "@/lib/api/client";

async function sendApplicationRequest<T>(
  method: "DELETE" | "PATCH" | "POST" | "PUT",
  body: unknown,
  fallbackError: string,
): Promise<DataResult<T>> {
  try {
    const response = await apiFetch("/api/applications", {
      method,
      body: JSON.stringify(body),
    });
    return parseApiResponse<T>(response, fallbackError);
  } catch {
    return { data: null, error: fallbackError };
  }
}

export function createApplicationRequest(application: Application) {
  return sendApplicationRequest<Application>(
    "POST",
    application,
    "Unable to create the application.",
  );
}

export function updateApplicationRequest(application: Application) {
  return sendApplicationRequest<Application>(
    "PUT",
    application,
    "Unable to update the application.",
  );
}

export function updateApplicationStatusRequest(
  applicationId: string,
  status: ApplicationStatus,
) {
  return sendApplicationRequest<Application>(
    "PATCH",
    { applicationId, status },
    "Unable to change application status.",
  );
}

export function deleteApplicationRequest(applicationId: string) {
  return sendApplicationRequest<true>(
    "DELETE",
    { applicationId },
    "Unable to delete the application.",
  );
}
