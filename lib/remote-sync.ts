import { countRecords, parseAppDataBackup, serializeAppDataBackup } from "@/lib/storage";
import type { AppDataBackup } from "@/lib/types";

type SyncConfig = {
  accessToken: string;
  gistFilename: string;
  gistId: string;
  githubToken: string;
};

type GistFile = {
  content?: string;
  truncated?: boolean;
};

type GistResponse = {
  files?: Record<string, GistFile>;
  updated_at?: string;
};

export type RemoteSyncMetadata = {
  exportedAt: string | null;
  hasRemoteBackup: boolean;
  recordCounts: ReturnType<typeof countRecords> | null;
  updatedAt: string | null;
};

function getSyncConfig(): SyncConfig | null {
  const gistId = process.env.SYNC_GIST_ID?.trim();
  const githubToken = process.env.SYNC_GITHUB_TOKEN?.trim();
  const accessToken = process.env.SYNC_ACCESS_TOKEN?.trim();
  const gistFilename =
    process.env.SYNC_GIST_FILENAME?.trim() || "internship-tracker-sync.json";

  if (!gistId || !githubToken || !accessToken) {
    return null;
  }

  return {
    accessToken,
    gistFilename,
    gistId,
    githubToken,
  };
}

function createGitHubHeaders(githubToken: string) {
  return {
    Accept: "application/vnd.github+json",
    Authorization: `Bearer ${githubToken}`,
    "Content-Type": "application/json",
    "User-Agent": "internship-tracker-dashboard",
    "X-GitHub-Api-Version": "2022-11-28",
  };
}

async function fetchGist(config: SyncConfig) {
  const response = await fetch(`https://api.github.com/gists/${config.gistId}`, {
    headers: createGitHubHeaders(config.githubToken),
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("Unable to reach the remote sync store.");
  }

  return (await response.json()) as GistResponse;
}

function readBackupFromGist(gist: GistResponse, filename: string) {
  const file = gist.files?.[filename];

  if (!file || !file.content || file.truncated) {
    return null;
  }

  return parseAppDataBackup(file.content);
}

export function isRemoteSyncAuthorized(request: Request) {
  const config = getSyncConfig();

  if (!config) {
    return {
      authorized: false,
      configured: false,
    } as const;
  }

  return {
    authorized: request.headers.get("x-sync-access-token") === config.accessToken,
    configured: true,
  } as const;
}

export async function getRemoteSyncMetadata(): Promise<RemoteSyncMetadata> {
  const config = getSyncConfig();

  if (!config) {
    throw new Error("Remote sync is not configured.");
  }

  const gist = await fetchGist(config);
  const backup = readBackupFromGist(gist, config.gistFilename);

  if (!backup) {
    return {
      exportedAt: null,
      hasRemoteBackup: false,
      recordCounts: null,
      updatedAt: gist.updated_at ?? null,
    };
  }

  return {
    exportedAt: backup.exportedAt,
    hasRemoteBackup: true,
    recordCounts: countRecords(backup.data),
    updatedAt: gist.updated_at ?? null,
  };
}

export async function getRemoteSyncBackup(): Promise<AppDataBackup | null> {
  const config = getSyncConfig();

  if (!config) {
    throw new Error("Remote sync is not configured.");
  }

  const gist = await fetchGist(config);

  return readBackupFromGist(gist, config.gistFilename);
}

export async function pushRemoteSyncBackup(backup: AppDataBackup) {
  const config = getSyncConfig();

  if (!config) {
    throw new Error("Remote sync is not configured.");
  }

  const response = await fetch(`https://api.github.com/gists/${config.gistId}`, {
    method: "PATCH",
    headers: createGitHubHeaders(config.githubToken),
    body: JSON.stringify({
      files: {
        [config.gistFilename]: {
          content: serializeAppDataBackup(backup),
        },
      },
    }),
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("Unable to push the current snapshot to remote sync.");
  }

  const gist = (await response.json()) as GistResponse;
  const savedBackup = readBackupFromGist(gist, config.gistFilename) ?? backup;

  return {
    exportedAt: savedBackup.exportedAt,
    recordCounts: countRecords(savedBackup.data),
    updatedAt: gist.updated_at ?? null,
  };
}
