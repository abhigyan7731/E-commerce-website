import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAuth } from "@clerk/nextjs/server";
import authAdmin from "@/middleware/authAdmin";

// POST: Toggle store active/inactive
export async function POST(request) {
  try {
    const { userId } = getAuth(request);
    const isAdmin = await authAdmin(userId);
    if (!isAdmin) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
    const { id, isActive } = await request.json();
    const store = await prisma.store.update({
      where: { id },
      data: { isActive },
    });
    return NextResponse.json({ message: `Store ${isActive ? "activated" : "deactivated"}`, store });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
