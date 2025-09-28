import { NextResponse } from "next/server";
import { getAuth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";
import authSeller from "@/middleware/authSeller";

export async function GET(request) {
    try {
        const { userId } = getAuth(request);
        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        
        const authResult = await authSeller(userId);
        if (!authResult || !authResult.storeId) {
            return NextResponse.json({ error: "Not authorized as seller" }, { status: 403 });
        }
        
        const { storeId } = authResult;
        
        // Skip temp admin store
        if (storeId === 'admin_temp_store') {
            return NextResponse.json({ 
                message: "Admin temp store - no real data",
                storeId,
                debug: "This is the admin bypass store"
            });
        }
        
        // Get all related data
        const store = await prisma.store.findUnique({
            where: { id: storeId }
        });
        
        const products = await prisma.product.findMany({
            where: { storeId },
            include: { store: true }
        });
        
        const orders = await prisma.order.findMany({
            where: { storeId },
            include: { 
                orderItems: {
                    include: { product: true }
                },
                user: true
            }
        });
        
        const allOrders = await prisma.order.findMany({
            include: { 
                orderItems: {
                    include: { product: true }
                }
            }
        });
        
        const productIds = products.map(p => p.id);
        const ratings = await prisma.rating.findMany({
            where: {
                productId: { in: productIds }
            },
            include: { user: true, product: true }
        });
        
        return NextResponse.json({
            storeId,
            store,
            products: products.length,
            orders: orders.length,
            ratings: ratings.length,
            productDetails: products,
            orderDetails: orders,
            ratingDetails: ratings,
            allOrdersCount: allOrders.length,
            debugInfo: {
                totalProductsInDB: await prisma.product.count(),
                totalOrdersInDB: await prisma.order.count(),
                totalRatingsInDB: await prisma.rating.count()
            }
        });
    } catch (error) {
        console.error('Store diagnostic error:', error);
        return NextResponse.json({ 
            error: error.message,
            stack: error.stack
        }, { status: 500 });
    }
}