import prisma from "@/lib/prisma";
import { getAuth } from "@clerk/nextjs/server"
import { PaymentMethod } from "@prisma/client";
import { NextResponse } from "next/server"
import Stripe from "stripe";

export async function POST(request){
    try {
        console.log('Orders POST API called')
        const { userId, has} = getAuth(request)
        console.log('User ID:', userId)
        const { addressId, paymentMethod, items, couponCode } = await request.json()
        if(!userId){
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }
        if(!addressId|| !paymentMethod || !items || !Array.isArray(items) || items.length === 0){
            return NextResponse.json({ error: "Missing address or payment method" }, { status: 400 });
        }
        let coupon = null;
        if(couponCode){
            coupon = await prisma.coupon.findUnique({
                where: { code: couponCode }
            })
            if(!coupon){
                return NextResponse.json({ error: "Invalid coupon code" }, { status: 400 })
            }
        }
         // check if coupon is applicable for new users
         if(couponCode && coupon.forNewUser){
            const userOrders = await prisma.order.findMany({ where: { userId } })
            if(userOrders.length > 0){
                return NextResponse.json({ error: "Coupon valid for new users only" }, { status: 400 })
            }
         }
         const isPlusMember = has({plan: 'plus'})
         //check if coupon is applicable for members
         if( couponCode && coupon.formember){
            if(!isPlusMember){
                return NextResponse.json({ error: "Coupon valid for members only" }, { status: 400 })
            }
         }
         // group orders by storeId using Map
         const ordersByStore = new Map()
         for (const item of items) {
            const product = await prisma.product.findUnique({ where: { id: item.id } })
            const storeId = product.storeId
            if (!ordersByStore.has(storeId)) {
                ordersByStore.set(storeId, [])
            }
            ordersByStore.get(storeId).push({ ...item, price: product.price })
         }
        let orderIds = [];
        let fullAmount = 0;

        let isShippingFeeAddes = false
        //create orders for each seller
        for(const [storeId, sellerItems] of ordersByStore.entries()){
            let total = sellerItems.reduce((acc, item) => acc + item.price * item.quantity, 0)

            if(couponCode){
                total -= (total * coupon.discount )/ 100;
            }
            if(!isPlusMember && !isShippingFeeAddes){
                total += 5;
                isShippingFeeAddes = true;
            }
            fullAmount += parseFloat(total.toFixed(2));
            const order = await prisma.order.create({
                data: {
                    userId,
                    storeId,
                    addressId,
                    paymentMethod,
                    total: parseFloat( total.toFixed(2)),
                    isCouponUsed: couponCode ? true : false,
                    coupon: couponCode ? coupon : {},
                    orderItems: {
                        create: sellerItems.map(item => ({
                            productId: item.id,
                            quantity: item.quantity,
                            price: item.price
                        }))

                    }

                    
                }
        })
        orderIds.push(order.id)
    }
    if(paymentMethod === 'STRIPE'){
        console.log('Creating Stripe session...')
        const stripe = Stripe(process.env.STRIPE_SECRET_KEY)
        // Get the origin with proper fallbacks
        const origin = request.headers.get('origin') || request.headers.get('host') || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
        
        // Ensure origin has protocol
        const baseUrl = origin.startsWith('http') ? origin : `http://${origin}`
        console.log('Base URL for redirects:', baseUrl)

        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: orderIds.map(orderId => ({
                price_data: {
                    currency: 'usd',
                    product_data: {
                        name: `Order ${orderId}`,
                    },
                    unit_amount: Math.round(fullAmount * 100),
                },
                quantity: 1
            })),
            expires_at: Math.floor(Date.now() / 1000) + 30 * 60,
           // time + 30 minutes
           mode: 'payment',
           success_url: `${baseUrl}/loading?nextUrl=orders`,
           cancel_url: `${baseUrl}/cart`,
           metadata: {
               orderIds: orderIds.join(','),
               userId,
               appId:'gocart'
           }
        })
        console.log('Stripe session created:', session.id)
        console.log('Stripe checkout URL:', session.url)
        return NextResponse.json({session, url: session.url, stripeSessionUrl: session.url})
    }
   // clear the cart 
await prisma.user.update({
    where: { id: userId },
    data: { cart: {} }
})
return NextResponse.json({message: "Order placed successfully", orderIds, fullAmount })
    } catch (error) { 
        console.error('Orders API Error:', error)
        console.error('Error details:', error.message)
        return NextResponse.json({ error: error.code || error.message }, { status: 500 })
    }
}

// get all orders for a user
export async function GET(request){
    try {
        const { userId } = getAuth(request)
        const orders = await prisma.order.findMany({
        where: {
            userId,
            OR: [
                { paymentMethod: PaymentMethod.COD },
                { AND: [{ paymentMethod: PaymentMethod.STRIPE }, { isPaid: true }] }
            ]
        },
        include: {
            user: true,
            address: true,
            orderItems: {include: {product: true}},
            store: true
        },
        orderBy: { createdAt: "desc" }
    })
        return NextResponse.json({ orders })
    } catch (error) {
        console.error(error)
        return NextResponse.json({ error: error.code || error.message }, { status: 400 })
    }
}