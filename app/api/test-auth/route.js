import { NextResponse } from "next/server";
import { getAuth } from "@clerk/nextjs/server";

export async function GET(request) {
    const { userId } = getAuth(request);
    
    return NextResponse.json({
        authenticated: !!userId,
        userId: userId || null,
        timestamp: new Date().toISOString(),
        url: request.url
    });
}