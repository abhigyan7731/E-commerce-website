import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import { getAuth } from "@clerk/nextjs/server";
import authAdmin from "@/middleware/authAdmin";


// get dashboard data for admin (total orders, total stores, total products, total revenue )
export async function GET(request) {
    try {
        const { userId } = getAuth(request)
        const isAdmin = await authAdmin(userId)
        if(!isAdmin){
            return NextResponse.json({error: "unauthorized"}, {status: 401});
        }
        // total orders
        const orders = await prisma.order.count()
        //get total stores on app
        const stores = await prisma.store.count()
        // get all order include only created and total & calculated total revenue
        const allOrders = await prisma.order.findMany({
            select: { createdAt: true, total: true }
        })
        let totalRevenue = 0
        allOrders.forEach(order => {
            totalRevenue += order.total
        })
        const revenue = totalRevenue.toFixed(2)
        // get product on app
        const products = await prisma.product.count()
        const dashboardData = {
            orders, stores, products, revenue, allOrders
        }
        return NextResponse.json({ dashboardData }) 
    } catch (error) {
        console.error(error)
        return NextResponse.json({error:  error.code || error.message}, {status: 400})
    }
}
