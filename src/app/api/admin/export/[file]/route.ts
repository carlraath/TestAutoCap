import { NextResponse } from "next/server";
import { getDb } from "@/db/client";
import { getSessionUser } from "@/lib/auth";
import { generateExport, isExportFileName } from "@/lib/exports";

export const dynamic = "force-dynamic";

/**
 * GET /api/admin/export/[file]: downloads one export file as an attachment.
 * Administrator session required, never cached, and every download is recorded
 * in the audit log as export.created.
 */
export async function GET(_request: Request, { params }: { params: Promise<{ file: string }> }): Promise<NextResponse> {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Not signed in." }, { status: 401, headers: { "Cache-Control": "no-store" } });
  if (user.role !== "admin") return NextResponse.json({ error: "Forbidden." }, { status: 403, headers: { "Cache-Control": "no-store" } });

  const { file } = await params;
  if (!isExportFileName(file)) {
    return NextResponse.json({ error: "Unknown export file." }, { status: 404, headers: { "Cache-Control": "no-store" } });
  }

  try {
    const db = await getDb();
    const generated = await generateExport(db, { userId: user.userId, username: user.username, role: "admin" }, file);
    return new NextResponse(generated.content, {
      status: 200,
      headers: {
        "Content-Type": generated.mimeType,
        "Content-Disposition": `attachment; filename="${generated.name}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (err) {
    console.error("export failed", err instanceof Error ? err.message : String(err));
    return NextResponse.json({ error: "The export could not be produced. Please try again." }, { status: 500, headers: { "Cache-Control": "no-store" } });
  }
}
