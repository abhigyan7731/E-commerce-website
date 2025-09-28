import { NextResponse } from "next/server";
import { getAuth } from "@clerk/nextjs/server";
import authAdmin from "@/middleware/authAdmin";

export async function GET(request) {
  try {
    const { userId } = getAuth(request);
    if (!userId) {
      return NextResponse.json({ isAdmin: false });
    }
    const isAdmin = await authAdmin(userId);
    return NextResponse.json({ isAdmin });
  } catch (error) {
    return NextResponse.json({ isAdmin: false, error: error.message }, { status: 500 });
  }
}
