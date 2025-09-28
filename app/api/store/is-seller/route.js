import { NextResponse } from 'next/server';
import { getAuth } from '@clerk/nextjs/server';
import prisma from '@/lib/prisma';

// Align the response with StoreLayout expectations: { isSeller, storeInfo }
export async function GET(request) {
  try {
    const { userId } = getAuth(request);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Allow admins to access the store dashboard as well
    const authAdmin = (await import('@/middleware/authAdmin')).default;
    const isAdmin = await authAdmin(userId);

    // Get the user's store, if any
    const store = await prisma.store.findUnique({
      where: { userId },
      select: {
        id: true,
        name: true,
        username: true,
        email: true,
        contact: true,
        logo: true,
        description: true,
        address: true,
        status: true,
        isActive: true,
      },
    });

    // If admin, provide temporary store access even without a store
    if (isAdmin) {
      const adminStoreInfo = store || {
        id: 'admin_temp_store',
        name: 'Admin Store',
        username: 'admin',
        email: 'admin@example.com',
        contact: '',
        logo: '',
        description: 'Temporary admin store for dashboard access',
        address: '',
        status: 'approved',
        isActive: true,
      };
      return NextResponse.json({ isSeller: true, storeInfo: adminStoreInfo });
    }

    const isSeller = Boolean(store && store.status === 'approved');
    const storeInfo = store || null;

    return NextResponse.json({ isSeller, storeInfo });
  } catch (error) {
    console.error('Error fetching seller status:', error);
    return NextResponse.json(
      { error: 'An internal server error occurred.' },
      { status: 500 }
    );
  }
}
