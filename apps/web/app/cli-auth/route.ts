import { NextResponse } from "next/server";

export function GET() {
  // Redirect to the new CLI auth page location
  return NextResponse.redirect(
    new URL(
      "/dashboard/cli-auth",
      process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
    ),
  );
}
