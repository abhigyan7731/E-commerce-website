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
            console.log('User is admin, checking for admin store or creating one')
            
            // Ensure admin user exists in our database
            let user = await prisma.user.findUnique({
                where: { id: userId },
                include: { store: true }
            });
            
            if (!user) {
                // Create the admin user if they don't exist
                try {
                    const { clerkClient } = await import('@clerk/nextjs/server');
                    const client = await clerkClient();
                    const clerkUser = await client.users.getUser(userId);
                    
                    user = await prisma.user.create({
                        data: {
                            id: userId,
                            name: clerkUser.firstName + ' ' + clerkUser.lastName || 'Admin User',
                            email: clerkUser.emailAddresses[0].emailAddress,
                            image: clerkUser.imageUrl || '',
                            cart: {}
                        }
                    });
                    console.log('Created admin user in database:', userId)
                } catch (userError) {
                    console.error('Error creating admin user:', userError)
                    return false;
                }
            }
            
            if (user?.store) {
                console.log('Admin already has a store:', user.store.id)
                return { storeId: user.store.id, isAdmin: true }
            }
            
            // Try to find an existing admin store or create one
            let adminStore = await prisma.store.findFirst({
                where: {
                    name: 'Admin Store',
                    status: 'approved'
                }
            });
            
            if (!adminStore) {
                try {
                    // Create an admin store if it doesn't exist
                    adminStore = await prisma.store.create({
                        data: {
                            name: 'Admin Store',
                            description: 'Administrative store for admin operations',
                            username: `admin_store_${Date.now()}`,
                            address: 'Administrative Address',
                            logo: '',
                            email: 'admin@store.com',
                            contact: '0000000000',
                            userId: userId,
                            status: 'approved',
                            isActive: true
                        }
                    });
                    console.log('Created admin store:', adminStore.id)
                } catch (storeError) {
                    console.error('Error creating admin store:', storeError)
                    // If we can't create a store, try to find any existing approved store for fallback
                    adminStore = await prisma.store.findFirst({
                        where: { status: 'approved' }
                    });
                    if (!adminStore) {
                        console.error('No approved stores found for admin fallback')
                        return false;
                    }
                    console.log('Using fallback store for admin:', adminStore.id)
                }
            }
            
            return { storeId: adminStore.id, isAdmin: true }
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