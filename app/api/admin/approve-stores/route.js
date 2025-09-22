import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAuth } from "@clerk/nextjs/server";
import authAdmin from "@/middleware/authAdmin";

// GET: List all stores pending approval
export async function GET(request) {
  try {
    const { userId } = getAuth(request);
    const isAdmin = await authAdmin(userId);
    if (!isAdmin) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
    const stores = await prisma.store.findMany({ where: { status: "pending" } });
    return NextResponse.json({ stores });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST: Approve a store by id
export async function POST(request) {
  try {
    const { userId } = getAuth(request);
    const isAdmin = await authAdmin(userId);
    if (!isAdmin) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
    const { id } = await request.json();
    const store = await prisma.store.update({
      where: { id },
      data: { status: "approved", isActive: true },
    });
    return NextResponse.json({ message: "Store approved", store });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
