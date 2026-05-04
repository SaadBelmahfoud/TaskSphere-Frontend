// Download API route — serves ZIP files from the public directory.
// Usage: GET /api/download?file=TaskSphere-Frontend_Phase3_20260504_1048.zip

import { NextRequest, NextResponse } from "next/server";
import { readFile } from "fs/promises";
import { join } from "path";

export async function GET(request: NextRequest) {
  const fileName = request.nextUrl.searchParams.get("file");

  if (!fileName) {
    return NextResponse.json(
      { error: "Missing 'file' query parameter" },
      { status: 400 }
    );
  }

  // Security: only allow .zip files and prevent directory traversal
  if (!fileName.endsWith(".zip") || fileName.includes("..") || fileName.includes("/")) {
    return NextResponse.json(
      { error: "Invalid file name" },
      { status: 400 }
    );
  }

  const filePath = join(process.cwd(), "public", fileName);

  try {
    const fileBuffer = await readFile(filePath);
    return new NextResponse(fileBuffer, {
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="${fileName}"`,
        "Content-Length": fileBuffer.length.toString(),
      },
    });
  } catch {
    return NextResponse.json(
      { error: "File not found" },
      { status: 404 }
    );
  }
}
