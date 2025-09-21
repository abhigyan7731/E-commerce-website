import { NextResponse } from 'next/server';
import { getAuth } from '@clerk/nextjs/server';
import prisma from '@/lib/prisma'; // Make sure you have this configured

export async function GET(request) {
  try {
    const { userId } = getAuth(request);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const store = await prisma.store.findUnique({
      where: { userId },
      select: { status: true },
    });

    if (store) {
      return NextResponse.json({ status: store.status });
    }

    // If no store is found, it means the user has not registered one yet
    return NextResponse.json({ status: "not_registered" });

  } catch (error) {
    console.error("Error fetching seller status:", error);
    return NextResponse.json({ error: "An internal server error occurred." }, { status: 500 });
  }
}
