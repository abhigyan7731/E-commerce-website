import { NextResponse } from "next/server";
import { getAuth } from "@clerk/nextjs/server";
import authAdmin from "@/middleware/authAdmin";

export async function GET(request) {
    try {
        const { userId } = getAuth(request);
        console.log('Debug - User ID:', userId);
        
        if (!userId) {
            return NextResponse.json({ 
                error: "No user authenticated",
                userId: null,
                isAdmin: false
            });
        }
        
        const isAdmin = await authAdmin(userId);
        console.log('Debug - Is Admin:', isAdmin);
        
        return NextResponse.json({
            userId,
            isAdmin,
            adminEmail: process.env.ADMIN_EMAIL || 'Not set',
            message: "Debug info"
        });
    } catch (error) {
        console.error('Debug error:', error);
        return NextResponse.json({ 
            error: error.message,
            stack: error.stack
        }, { status: 500 });
    }
}