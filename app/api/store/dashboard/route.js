import prisma from "@/lib/prisma";
import authSeller from "@/middleware/authSeller";
import {getAuth} from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

// get dashboard data for seller
export async function GET(request) {
    try {
        console.log('Store dashboard API called')
        console.log('Request URL:', request.url)
        console.log('Request headers:', Object.fromEntries(request.headers.entries()))
        
        const { userId } = getAuth(request)
        console.log('User ID:', userId)
        
        if (!userId) {
            console.log('No user ID provided')
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }
        
        const authResult = await authSeller(userId)
        console.log('Auth seller result:', authResult)
        
        if (!authResult || !authResult.storeId) {
            console.log('Not authorized as seller or no store found')
            return NextResponse.json({ error: "Not authorized as seller" }, { status: 403 })
        }
        
        const { storeId } = authResult
        console.log('Store ID:', storeId)

        // Handle admin temporary store case
        if (storeId === 'admin_temp_store') {
            console.log('Admin temporary store access - returning aggregated data from all stores')
            
            // For admin, show aggregated data from all stores instead of empty data
            const allOrders = await prisma.order.findMany({})
            const allProducts = await prisma.product.findMany({})
            const allRatings = await prisma.rating.findMany({
                include: { user: true, product: true }
            })
            
            const dashboardData = {
                ratings: allRatings.slice(0, 10), // Show first 10 ratings
                totalOrders: allOrders.length,
                totalEarnings: Math.round(allOrders.reduce((acc, order) => acc + order.total, 0)),
                totalProducts: allProducts.length
            }
            
            console.log('Admin aggregated data:', dashboardData)
            return NextResponse.json({ dashboardData })
        }

        const orders = await prisma.order.findMany({
            where: { storeId } 
        })
        console.log('Orders found:', orders.length)
        
        const products = await prisma.product.findMany({
            where: { storeId } 
        })
        console.log('Products found:', products.length)
        
        const ratings = await prisma.rating.findMany({
            where: {productId: { in: products.map(product => product.id)}},
            include: { user: true, product: true }
        })
        console.log('Ratings found:', ratings.length)
        
        const dashboardData = {
            ratings,
            totalOrders: orders.length,
            totalEarnings: Math.round(orders.reduce((acc, order) => acc + order.total, 0)),
            totalProducts: products.length
        }
        
        console.log('Dashboard data prepared:', dashboardData)
        return NextResponse.json({ dashboardData });
    } catch (error) {
        console.error('Store dashboard error:', error)
        return NextResponse.json({ error: error.code || error.message }, { status: 500 })
    }
}