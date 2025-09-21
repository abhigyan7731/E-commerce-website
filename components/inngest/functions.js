// Inngest function to handle coupon creation events
export const couponCreated = inngest.createFunction(
    { id: "coupon-created" },
    { event: "app/coupon/created" },
    async ({ event }) => {
        // Log the event for dashboard visibility
        console.log("Coupon created event received:", event.data);
        // You can add more logic here if needed
        return { received: true };
    }
);
import {inngest} from './client'
import prisma from '@/lib/prisma'

// Inngest Function to save user data to a database
export const syncUserCreation = inngest.createFunction(
    {id: 'sync-user-create'},
    {event: 'clerk/user.create'},
    async ({ event }) => {
        const {data} = event
        await prisma.user.create({
            data: {
                id: data.id,
                email: data.email_addresses[0].email_address,
                name: '${data.first_name} ${data.last_name}',
                image: data.image_url,
            }
        })
    }
)

//Inngest function to update user data in database
export const synUserUpdation = inngest.createFunction(
    {id: 'sync-user-update'},
    { event: 'clerk/user.updated' },
    async ({ event }) => {
        const { data } = event
        await prisma.user.update({
            where: {id: data.id,},
            data: {
                email: data.email_addresses[0].email_address,
                name: '${data.first_name} ${data.last_name}',
                image: data.image_url,
            }
        })
    }
)

// Inngest function to delete user from database
export const syncUserDeletion = inngest.createFunction(
     {id: 'sync-user-delete'},
    { event: 'clerk/user.deleted' },
    async ({ event }) => {
        const { data } = event
        await prisma.user.delete({
            where: {id: data.id,}
            
        })
    }
)
 // Inngest function to delete coupan on expire
 export const deleteCouponExpiry = inngest.createFunction(
    {id: 'delete-coupon-on-expiry'},
    { event: 'app/coupan/expired' },
    async ({ event, step }) => {   
        const { data } = event   
        const expiryDate = new Date(data.expires_at)
        await step.sleepUntil('wait-for-expiry', expiryDate)

        await step.run('delete-coupon-from-database', async () => {
            await prisma.coupon.delete({
                where: { code: data.code }
            })
        })
    }   
)
 