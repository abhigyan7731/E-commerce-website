import prisma from "@/lib/prisma";
import authSeller from "@/middleware/authSeller";
import { getAuth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";


// toggle stock status of a product
export async function POST(request) {
    try {
        const { userId } = getAuth(request)
        const { productId } = await request.json()
        if (!productId) {
            return NextResponse.json({ error: "missing user or product info" }, { status: 400 })    

        }
        const { storeId } = await authSeller(userId)
        if (!storeId) {
            return NextResponse.json({ error: "unauthorized" }, { status: 401 })
        }
        
        // Handle admin temporary store case - allow toggling any product
        if (storeId === 'admin_temp_store') {
            const product = await prisma.product.findUnique({
                where: { id: productId }
            })
            if (!product) {
                return NextResponse.json({ error: "product not found" }, { status: 404 })
            }
            await prisma.product.update({
                where: { id: productId },
                data: { inStock: !product.inStock }
            })
            return NextResponse.json({ message: "product stock status updated successfully" })
        }
        
        //  check if product exists
        const product = await prisma.product.findFirst({
            where: { id: productId, storeId }
        })

        if (!product) {
            return NextResponse.json({ error: "product not found" }, { status: 404 })
        }
        
        await prisma.product.update({
            where: { id: productId },
            data: { inStock: !product.inStock }
        })
        return NextResponse.json({ message: "product stock status updated successfully" })
    }
        catch (error) {
        console.error(error)
        return NextResponse.json({ error: "internal server error" }, { status: 400 })
    }
}