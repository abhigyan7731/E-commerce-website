import prisma from "@/lib/prisma"
import { getAuth } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"


//update user cart
export async function POST(request) {
    try {
        const { userId } = getAuth(request)
        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }
        
        const { cart } = await request.json()
        
        // Check if user exists, create if not
        let user = await prisma.user.findUnique({ where: { id: userId } })
        if (!user) {
            // Create user if not found
            user = await prisma.user.create({
                data: {
                    id: userId,
                    name: "Unknown",
                    email: "unknown@example.com",
                    image: "",
                    cart: cart || {}
                }
            })
        } else {
            // Update existing user's cart
            await prisma.user.update({
                where: { id: userId },
                data: { cart: cart || {} }
            })
        }
        
        return NextResponse.json({ message: "cart updated successfully" })
    } catch (error) {
        console.error(error)
        return NextResponse.json({ error: error.code || error.message }, { status: 400 })
    }
}

//get user cart
export async function GET(request) {
    try {
        const { userId } = getAuth(request)
        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }
        
        const user = await prisma.user.findUnique({
            where: { id: userId }
        })
        
        if (!user) {
            // Return empty cart if user doesn't exist
            return NextResponse.json({ cart: {} })
        }
        
        return NextResponse.json({ cart: user.cart || {} })
    } catch (error) {
        console.error(error)
        return NextResponse.json({ error: error.code || error.message }, { status: 400 })
    }
}