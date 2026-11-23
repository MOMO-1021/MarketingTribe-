import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const GITHUB_RELEASE_APK_URL =
  "https://github.com/MOMO-1021/MarketingTribe-/releases/download/v1.0.0/MarketingTribe.apk";

export async function GET() {
  const localApkPath = path.join(process.cwd(), "public", "downloads", "MarketingTribe.apk");

  // If the compiled APK exists in the public directory, serve it directly
  if (fs.existsSync(localApkPath)) {
    try {
      const fileBuffer = fs.readFileSync(localApkPath);
      return new Response(fileBuffer, {
        status: 200,
        headers: {
          "Content-Type": "application/vnd.android.package-archive",
          "Content-Disposition": 'attachment; filename="MarketingTribe.apk"',
          "Content-Length": fileBuffer.length.toString(),
          "Cache-Control": "public, max-age=3600",
        },
      });
    } catch {
      // Fallback to GitHub Release URL
    }
  }

  // Redirect to GitHub Release APK
  return NextResponse.redirect(GITHUB_RELEASE_APK_URL, 302);
}
