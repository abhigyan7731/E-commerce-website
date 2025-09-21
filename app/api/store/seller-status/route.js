import { NextResponse } from 'next/server';
import { getAuth } from '@clerk/nextjs/server';
import prisma from '@/lib/prisma';

/**
 * @description Checks if a user has already registered a store and returns its status.
 * @param {Request} request The incoming request object.
 * @returns {NextResponse} The response object.
 */
export async function GET(request) {
  try {
    const { userId } = getAuth(request);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized. Please log in." }, { status: 401 });
    }

    const store = await prisma.store.findUnique({
      where: { userId },
      select: { status: true },
    });

    if (store) {
      return NextResponse.json({ status: store.status });
    }

    return NextResponse.json({ status: "not_registered" });

  } catch (error) {
    console.error("Error fetching seller status:", error);
    return NextResponse.json({ error: "An internal server error occurred." }, { status: 500 });
  }
}
