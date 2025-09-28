import prisma from "@/lib/prisma";
import { getAuth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

// verify coupon
export async function POST(request) {
    try {
        const { userId, has } = getAuth(request);
        const { code } = await request.json();
        if (!code) {
            return NextResponse.json({ error: "Missing coupon code" }, { status: 400 });
        }

        // Find a valid coupon by code
        let coupon = await prisma.coupon.findUnique({
            where: { code: code.toUpperCase() },
        });

        // Seed a few default coupons on demand for dev/demo if missing
        if (!coupon) {
            const defaults = {
                NEW20: { code: 'NEW20', description: '20% Off for New Users', discount: 20, forNewUser: true, forMember: false, isPublic: true, expiresAt: new Date('2027-12-31') },
                OFF10: { code: 'OFF10', description: '10% Off for All Users', discount: 10, forNewUser: false, forMember: false, isPublic: true, expiresAt: new Date('2027-12-31') },
                SALE10: { code: 'SALE10', description: '10% Off Sitewide', discount: 10, forNewUser: false, forMember: false, isPublic: true, expiresAt: new Date('2027-12-31') },
                PLUS10: { code: 'PLUS10', description: '10% Off for Members', discount: 10, forNewUser: false, forMember: true, isPublic: true, expiresAt: new Date('2027-12-31') },
                PLUS20: { code: 'PLUS20', description: '20% Off for Members', discount: 20, forNewUser: false, forMember: true, isPublic: true, expiresAt: new Date('2027-12-31') },
            };
            const fallback = defaults[code.toUpperCase()];
            if (fallback) {
                coupon = await prisma.coupon.upsert({
                    where: { code: fallback.code },
                    update: {},
                    create: fallback,
                });
            }
        }

        if (!coupon) {
            return NextResponse.json({ error: "Coupon not found" }, { status: 404 });
        }
        if (new Date(coupon.expiresAt) <= new Date()) {
            return NextResponse.json({ error: "Coupon expired" }, { status: 400 });
        }

        // For new users only
        if (coupon.forNewUser) {
            const userOrders = await prisma.order.findMany({ where: { userId } });
            if (userOrders.length > 0) {
                return NextResponse.json({ error: "Coupon valid for new users only" }, { status: 400 });
            }
        }

        // Members-only coupons
        if (coupon.forMember) {
            const hasPlusPlan = has?.({ plan: "plus" });
            if (!hasPlusPlan) {
                return NextResponse.json({ error: "Coupon valid for members only" }, { status: 400 });
            }
        }

        return NextResponse.json({ coupon });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: error.code || error.message }, { status: 400 });
    }
}