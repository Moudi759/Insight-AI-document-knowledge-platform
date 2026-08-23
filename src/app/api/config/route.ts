import { NextResponse } from "next/server";
import { ACCEPTED_EXTENSIONS_FLAT, getMaxFileSizeMb } from "@/lib/constants";

/**
 * Public client configuration — lets UI components stay in sync with
 * server-side limits (e.g. the smaller upload cap on serverless hosts).
 */
export async function GET() {
  return NextResponse.json({
    maxFileSizeMb: getMaxFileSizeMb(),
    acceptedExtensions: ACCEPTED_EXTENSIONS_FLAT,
  });
}
