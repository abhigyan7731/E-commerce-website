import { NextResponse } from "next/server"
import { getAuth } from "@clerk/nextjs/server"
import authAdmin from "@/middleware/authAdmin"

//auth admin
export async function GET(request) {
    try {
        const { userId } = getAuth(request)
        const isAdmin = await authAdmin(userId)

        if(!isAdmin){
            return NextResponse.json({error: "unauthorized"}, {status: 401})
        }
        return NextResponse.json({isAdmin})
    } catch (error) {
        console.error(error)
        return NextResponse.json({error:  error.code || error.message}, {status: 400})
    }
}