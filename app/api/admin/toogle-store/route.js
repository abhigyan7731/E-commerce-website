import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import { getAuth } from "@clerk/nextjs/server";
import authAdmin from "@/middleware/authAdmin";

// toggle store is active
export async function POST(request) {
    try {
        const { userId } = getAuth(request)
        const isAdmin = await authAdmin(userId)
        if(!isAdmin){
            return NextResponse.json({error: "unauthorized"}, {status: 401})
        }
        const { storeId } = await request.json()
        if (!storeId) {
            return NextResponse.json({ error: "missing store info" }, { status: 400 });   
        }
      // FIND THE STORE
        const store = await prisma.store.findUnique({
            where: { id: storeId }
        })
        if (!store) {
            return NextResponse.json({ error: "store not found" }, { status: 404 });   
        }
        await prisma.store.update({
            where: { id: storeId },
            data: { isActive: !store.isActive }
        })
        return NextResponse.json({ message: "store status updated successfully" })
    } catch (error) {
        console.error(error)
        return NextResponse.json({error:  error.code || error.message}, {status: 400})
    }
}


