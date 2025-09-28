import prisma from "@/lib/prisma"

const authSeller = async (userId) => {
    try {
        console.log('AuthSeller called with userId:', userId)
        
        if (!userId) {
            console.log('No userId provided to authSeller')
            return false
        }
        
        // Check if user is admin first
        const authAdmin = (await import('./authAdmin')).default;
        const isAdmin = await authAdmin(userId);
        
        if (isAdmin) {
            console.log('User is admin, providing temporary store access')
            return { storeId: 'admin_temp_store' }
        }
        
        const user = await prisma.user.findUnique({
            where: { id: userId },
            include: { store: true },
        }) 
        
        console.log('User found:', user ? 'yes' : 'no')
        console.log('User has store:', user?.store ? 'yes' : 'no')
        
        if (user?.store) {
            console.log('Returning storeId:', user.store.id)
            // Allow store owners to access their orders regardless of approval status
            return { storeId: user.store.id }
        }
        
        console.log('No store found for user')
        return false;
    } catch (error) {
        console.error('AuthSeller error:', error)
        return false
    }
}

export default authSeller