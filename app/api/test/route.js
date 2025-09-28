import { NextResponse } from "next/server";

export async function GET() {
    console.log('Basic test route called')
    return NextResponse.json({ message: "API is working", timestamp: new Date().toISOString() });
}