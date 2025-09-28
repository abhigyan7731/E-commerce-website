import prisma from "@/lib/prisma"
import { NextResponse } from "next/server"
import { getAuth } from "@clerk/nextjs/server"
import authSeller from "@/middleware/authSeller"




// update seller order status
export async function POST(request) {
    try {
        const { userId } = getAuth(request)
        const { storeId } = await authSeller(userId)
        if (!storeId) {
            return NextResponse.json({ error: "unauthorized" }, { status: 401 })
        }
        const { orderId, status } = await request.json()

        // Handle admin temporary store case - allow updating any order
        if (storeId === 'admin_temp_store') {
            await prisma.order.update({
                where: { id: orderId },
                data: { status }
            })
            return NextResponse.json({message: "order status updated" })
        }

        await prisma.order.update({
            where: { id: orderId , storeId},
            data: { status }
        })
            return NextResponse.json({message: "order status updated" })
    } catch (error) {
        console.error(error)
        return NextResponse.json({ error: error.code || error.message }, { status: 400 })
    }
}

// get seller orders
export async function GET(request) {
    try {
        const { userId } = getAuth(request)
        const { storeId } = await authSeller(userId)
        if (!storeId) {
            return NextResponse.json({ error: "unauthorized" }, { status: 401 })
        }
        
        // Handle admin temporary store case - return all orders from all stores
        if (storeId === 'admin_temp_store') {
            const orders = await prisma.order.findMany({
                include: {
                    user: true,
                    address: true,
                    orderItems: { include: { product: true } },
                    store: true
                },
                orderBy: { createdAt: "desc" }
            })
            return NextResponse.json({ orders })
        }
        
        const orders = await prisma.order.findMany({
            where: { storeId },
            include: {
                user: true,
                address: true,
                orderItems:  {include: {product: true}}},
                orderBy: { createdAt: "desc" }
            })
        return NextResponse.json({ orders })
    } catch (error) {
        console.error(error)
        return NextResponse.json({ error: error.code || error.message }, { status: 400 })
    }
}