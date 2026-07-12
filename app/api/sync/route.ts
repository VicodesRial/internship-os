import { NextResponse } from "next/server";

import {
  getRemoteSyncBackup,
  getRemoteSyncMetadata,
  isRemoteSyncAuthorized,
  pushRemoteSyncBackup,
} from "@/lib/remote-sync";
import { createAppDataBackup, parseAppDataBackup } from "@/lib/storage";

export const dynamic = "force-dynamic";

function createUnauthorizedResponse() {
  return NextResponse.json(
    {
      configured: true,
      message:
        "Remote sync requires a valid sync access key saved in this browser.",
    },
    { status: 401 },
  );
}

export async function GET(request: Request) {
  const authorization = isRemoteSyncAuthorized(request);

  if (!authorization.configured) {
    return NextResponse.json(
      {
        configured: false,
        message:
          "Remote sync is not configured. Add SYNC_GIST_ID, SYNC_GITHUB_TOKEN, and SYNC_ACCESS_TOKEN on the server.",
      },
      { status: 503 },
    );
  }

  if (!authorization.authorized) {
    return createUnauthorizedResponse();
  }

  const { searchParams } = new URL(request.url);
  const metadataOnly = searchParams.get("metadata") === "1";

  try {
    if (metadataOnly) {
      const metadata = await getRemoteSyncMetadata();

      return NextResponse.json({
        configured: true,
        metadata,
      });
    }

    const backup = await getRemoteSyncBackup();

    if (!backup) {
      return NextResponse.json(
        {
          configured: true,
          message:
            "No remote snapshot exists yet. Push your current local tracker first.",
        },
        { status: 404 },
      );
    }

    return NextResponse.json({
      configured: true,
      backup,
    });
  } catch {
    return NextResponse.json(
      {
        configured: true,
        message: "Remote sync request failed.",
      },
      { status: 502 },
    );
  }
}

export async function POST(request: Request) {
  const authorization = isRemoteSyncAuthorized(request);

  if (!authorization.configured) {
    return NextResponse.json(
      {
        configured: false,
        message:
          "Remote sync is not configured. Add SYNC_GIST_ID, SYNC_GITHUB_TOKEN, and SYNC_ACCESS_TOKEN on the server.",
      },
      { status: 503 },
    );
  }

  if (!authorization.authorized) {
    return createUnauthorizedResponse();
  }

  try {
    const payload = (await request.json()) as {
      backupJson?: string;
    };
    const parsedBackup = parseAppDataBackup(payload.backupJson ?? "");

    if (!parsedBackup) {
      return NextResponse.json(
        {
          configured: true,
          message: "Invalid backup payload.",
        },
        { status: 400 },
      );
    }

    const nextBackup = createAppDataBackup(parsedBackup.data);
    const metadata = await pushRemoteSyncBackup(nextBackup);

    return NextResponse.json({
      configured: true,
      metadata,
    });
  } catch {
    return NextResponse.json(
      {
        configured: true,
        message: "Remote sync push failed.",
      },
      { status: 502 },
    );
  }
}
