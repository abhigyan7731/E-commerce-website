import imagekit from "@/configs/imageKit";
import prisma from "@/lib/prisma";
import authSeller from "@/middleware/authSeller";
import {getAuth} from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

//   add a new product
export async function POST(request) {
    try {
        const { userId } = getAuth(request)
        const { storeId } = await authSeller(userId)
        if (!storeId) {
            return NextResponse.json({ error: "unauthorized" }, { status: 401 })
        }
        const formData = await request.formData()
        const name = formData.get("name")
        const description = formData.get("description")
        const mrp =  Number(formData.get("mrp"))
        const price = Number (formData.get("price"))
        const category = formData.get("category")
        const quantity = formData.get("quantity")
        const image = formData.get("image") 
        if (!name || !description || !mrp || !price || !category || !quantity || !image) {
            return NextResponse.json({ error: "missing product info" }, { status: 400 })
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
                quantity,
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
        const { storeId } = await authSeller(userId)
        if (!storeId) {
            return NextResponse.json({ error: "unauthorized" }, { status: 401 })
        }
        const products = await prisma.product.findMany({
            where: {storeId }})
        return NextResponse.json({ products })
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: error.code || error.messgae }, { status: 400 })
    }
}
       