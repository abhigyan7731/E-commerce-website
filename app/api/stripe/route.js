import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import Stripe from "stripe";

// Initialize Stripe with validation
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
    apiVersion: '2023-10-16',
});

export async function POST(request) {
    try {
        console.log('Stripe webhook received');
        
        const body = await request.text();
        const signature = request.headers.get("stripe-signature");
        
        if (!signature) {
            return NextResponse.json({ error: "No signature" }, { status: 400 });
        }
        
        if (!process.env.STRIPE_WEBHOOK_SECRET) {
            return NextResponse.json({ error: "No webhook secret" }, { status: 500 });
        }
        
        let event;
        try {
            event = stripe.webhooks.constructEvent(
                body,
                signature,
                process.env.STRIPE_WEBHOOK_SECRET
            );
        } catch (err) {
            console.error("Webhook signature verification failed:", err.message);
            return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
        }
        
        console.log("Event type:", event.type);
        
        // Handle checkout session completed (most reliable)
        if (event.type === 'checkout.session.completed') {
            const session = event.data.object;
            
            if (session.metadata && session.metadata.appId === 'gocart') {
                const { orderIds, userId } = session.metadata;
                
                if (orderIds && userId) {
                    const orderIdsArray = orderIds.split(',');
                    console.log('Processing orders:', orderIdsArray);
                    
                    // Update orders
                    for (const orderId of orderIdsArray) {
                        try {
                            await prisma.order.update({
                                where: { id: orderId },
                                data: { isPaid: true }
                            });
                            console.log('Order updated:', orderId);
                        } catch (error) {
                            console.error('Failed to update order:', orderId, error);
                        }
                    }
                    
                    // Clear cart
                    try {
                        await prisma.user.update({
                            where: { id: userId },
                            data: { cart: {} }
                        });
                        console.log('Cart cleared for user:', userId);
                    } catch (error) {
                        console.error('Failed to clear cart:', error);
                    }
                }
            }
        }
        
        return NextResponse.json({ received: true });
        
    } catch (error) {
        console.error('Webhook error:', error);
        return NextResponse.json(
            { error: "Webhook handler failed" },
            { status: 500 }
        );
    }
}

export const config = {
    api: { bodyParser: false }
}
