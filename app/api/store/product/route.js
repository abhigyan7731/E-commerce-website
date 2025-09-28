import imagekit from "@/configs/imageKit";
import prisma from "@/lib/prisma";
import authSeller from "@/middleware/authSeller";
import {getAuth} from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

//   add a new product
export async function POST(request) {
    try {
        const { userId } = getAuth(request)
        const authResult = await authSeller(userId)
        
        if (!authResult || !authResult.storeId) {
            return NextResponse.json({ error: "Unauthorized: No valid store found" }, { status: 401 })
        }
        
        const { storeId, isAdmin } = authResult
        
        const formData = await request.formData()
        const name = formData.get("name")
        const description = formData.get("description")
        const mrp = Number(formData.get("mrp"))
        const price = Number(formData.get("price"))
        const category = formData.get("category")
        
        // Collect all images appended under the same key "image"
        const images = formData.getAll("image")
        
        // Input validation
        if (!name || !description || !mrp || !price || !category || images.length === 0) {
            return NextResponse.json({ error: "Missing required product information" }, { status: 400 })
        }
        
        if (mrp <= 0 || price <= 0) {
            return NextResponse.json({ error: "Prices must be greater than 0" }, { status: 400 })
        }
        
        if (price > mrp) {
            return NextResponse.json({ error: "Offer price cannot be greater than actual price" }, { status: 400 })
        }
        // upload image to imagekit
        const imagesUrl = await Promise.all(images.map( async (image) => {   
            const buffer = Buffer.from(await image.arrayBuffer())
            const response = await imagekit.upload({
                file: buffer,
                fileName: image.name,
                folder: "products"
            })
            const url = imagekit.url({    
                path: response.filePath,
                transformation: [
                    { quality: 'auto' },
                    { format: 'webp' },
                    { width: '500' }
                ]
            })
            return url   

        }))

        await prisma.product.create({
            data: {
                name,
                description,
                mrp,
                price,
                category,
                images: imagesUrl,
                storeId
            }
        })
        return NextResponse.json({ message: "product added successfully" })
    } catch (error) {
        console.error(error)
        return NextResponse.json({ error: "internal server error" }, { status: 400 })
    }
}

// get all products of a store
export async function GET(request) {
    try { 
        const { userId } = getAuth(request)
        const authResult = await authSeller(userId)
        
        if (!authResult || !authResult.storeId) {
            return NextResponse.json({ error: "Unauthorized: No valid store found" }, { status: 401 })
        }
        
        const { storeId, isAdmin } = authResult
        
        // Handle admin case - return all products from all stores for admin view
        if (isAdmin) {
            const products = await prisma.product.findMany({
                include: { 
                    store: {
                        select: {
                            id: true,
                            name: true,
                            description: true
                        }
                    }
                },
                orderBy: { createdAt: 'desc' }
            })
            return NextResponse.json({ products, isAdmin: true })
        }
        
        // Regular store owner - return only their products
        const products = await prisma.product.findMany({
            where: { storeId },
            orderBy: { createdAt: 'desc' }
        })
        
        return NextResponse.json({ products })
    } catch (error) {
        console.error('Error fetching products:', error)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}
       