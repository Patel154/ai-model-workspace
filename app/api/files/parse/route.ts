import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// Extracts text from PDFs server-side (pdf-parse needs Node APIs that
// aren't available in the browser). Text-based files and images never
// hit this route — they're handled entirely client-side in file-utils.ts.
export async function POST(req: NextRequest) {
  const form = await req.formData().catch(() => null);
  const file = form?.get("file");

  if (!file || !(file instanceof File)) {
    return NextResponse.json(
      { error: { message: "No file was provided.", type: "bad_request" } },
      { status: 400 }
    );
  }

  if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
    return NextResponse.json(
      {
        error: {
          message: "Only PDF files are supported by this endpoint.",
          type: "unsupported_file_type"
        }
      },
      { status: 415 }
    );
  }

  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    const pdfParse = (await import("pdf-parse")).default;
    const parsed = await pdfParse(buffer);
    const MAX_CHARS = 120_000;
    const truncated = parsed.text.length > MAX_CHARS;
    return NextResponse.json({
      text: truncated ? parsed.text.slice(0, MAX_CHARS) : parsed.text,
      pages: parsed.numpages,
      truncated
    });
  } catch (err) {
    return NextResponse.json(
      {
        error: {
          message:
            "Couldn't extract text from this PDF. It may be scanned/image-based or corrupted.",
          type: "parse_error"
        }
      },
      { status: 422 }
    );
  }
}
