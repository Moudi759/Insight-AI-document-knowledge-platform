import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { auth } from "@/lib/server/auth";
import { Prisma } from "@prisma/client";

export interface ApiError {
  code: string;
  message: string;
  status: number;
}

export function createApiError(
  code: string,
  message: string,
  status: number
): ApiError & Error {
  const error = new Error(message) as ApiError & Error;
  error.code = code;
  error.status = status;
  return error;
}

export class UnauthorizedError extends Error {
  constructor() {
    super("Unauthorized");
    this.name = "UnauthorizedError";
  }
}

export async function requireUserId(): Promise<string> {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) throw new UnauthorizedError();
  return userId;
}

const ERROR_STATUS_MAP: Record<string, number> = {
  P2002: 409,
  P2025: 404,
};

export function handleApiError(error: unknown): NextResponse {
  if (error instanceof UnauthorizedError) {
    return NextResponse.json(
      { error: "You must be signed in to perform this action." },
      { status: 401 }
    );
  }

  if (error instanceof ZodError) {
    return NextResponse.json(
      { error: error.issues[0]?.message ?? "Invalid input." },
      { status: 400 }
    );
  }

  if (error && typeof error === "object" && "code" in error && "status" in error) {
    const apiError = error as ApiError;
    console.error(`[api] ${apiError.code}: ${apiError.message}`);
    return NextResponse.json(
      { error: apiError.message },
      { status: apiError.status }
    );
  }

  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    const status = ERROR_STATUS_MAP[error.code] ?? 500;
    console.error(`[api] prisma ${error.code}:`, error.message);
    return NextResponse.json(
      {
        error:
          status === 409
            ? "That record already exists."
            : status === 404
              ? "The requested item was not found."
              : "A database error occurred.",
      },
      { status }
    );
  }

  if (error instanceof Prisma.PrismaClientInitializationError) {
    console.error("[api] database connection failed:", error.message);
    return NextResponse.json(
      { error: "Could not reach the database. Please try again later." },
      { status: 503 }
    );
  }

  console.error("[api] unexpected error:", error);
  return NextResponse.json(
    { error: "Something went wrong. Please try again." },
    { status: 500 }
  );
}
