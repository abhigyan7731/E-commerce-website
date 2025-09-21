import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { getAuth } from "@clerk/nextjs/server"
import authAdmin from "@/middleware/authAdmin"

// GET /api/admin/coupons
export async function GET(request) {
    try {
        const { userId } = getAuth(request)
        const isAdmin = await authAdmin(userId)
        if (!isAdmin) {
            return NextResponse.json({ error: "unauthorized" }, { status: 401 })
        }
        const coupons = await prisma.coupon.findMany()
        return NextResponse.json({ coupons })
    } catch (error) {
        console.error(error)
        return NextResponse.json({ error: error.code || error.message }, { status: 400 })
    }
}

// POST /api/admin/coupons
export async function POST(request) {
    try {
        const { userId } = getAuth(request)
        const isAdmin = await authAdmin(userId)
        if (!isAdmin) {
            return NextResponse.json({ error: "unauthorized" }, { status: 401 })
        }
        const body = await request.json()
        // Check if coupon code already exists
        const existing = await prisma.coupon.findUnique({ where: { code: body.code } })
        if (existing) {
            return NextResponse.json({ error: "Coupon code already exists" }, { status: 400 })
        }
        await prisma.coupon.create({ data: body })
        const coupons = await prisma.coupon.findMany()
        return NextResponse.json({ message: "Coupon added successfully", coupons })
    } catch (error) {
        console.error(error)
        return NextResponse.json({ error: error.code || error.message }, { status: 400 })
    }
}

// DELETE /api/admin/coupons?code=...
export async function DELETE(request) {
    try {
        const { userId } = getAuth(request)
        const isAdmin = await authAdmin(userId)
        if (!isAdmin) {
            return NextResponse.json({ error: "unauthorized" }, { status: 401 })
        }
        const { searchParams } = new URL(request.url)
        const code = searchParams.get("code")
        await prisma.coupon.deleteMany({ where: { code } })
        const coupons = await prisma.coupon.findMany()
        return NextResponse.json({ message: "Coupon deleted successfully", coupons })
    } catch (error) {
        console.error(error)
        return NextResponse.json({ error: error.code || error.message }, { status: 400 })
    }
}
