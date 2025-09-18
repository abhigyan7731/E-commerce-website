'use client'

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { CircleDollarSignIcon, ShoppingBasketIcon, StoreIcon, TagsIcon } from 'lucide-react';
import { dummyAdminDashboardData } from '@/assets/assets';
import Loading from '@/components/Loading';

// Dynamically import the chart component with SSR turned off
const OrdersAreaChart = dynamic(() => import('@/components/OrdersAreaChart'), { ssr: false });

export default function AdminDashboard() {
  const currency = process.env.NEXT_PUBLIC_CURRENCY_SYMBOL || '$';

  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState({
    products: 0,
    revenue: 0,
    orders: 0,
    stores: 0,
    allOrders: [],
  });

  // Fetch data on component mount
  useEffect(() => {
    const fetchDashboardData = () => {
      setDashboardData(dummyAdminDashboardData);
      setLoading(false);
    };
    fetchDashboardData();
  }, []);

  const dashboardCardsData = [
    { title: 'Total Products', value: dashboardData.products, icon: ShoppingBasketIcon },
    { title: 'Total Revenue', value: `${currency}${dashboardData.revenue}`, icon: CircleDollarSignIcon },
    { title: 'Total Orders', value: dashboardData.orders, icon: TagsIcon },
    { title: 'Total Stores', value: dashboardData.stores, icon: StoreIcon },
  ];

  if (loading) {
    return <Loading />;
  }

  return (
    <div className="text-slate-500">
      <h1 className="text-2xl">
        Admin <span className="font-medium text-slate-800">Dashboard</span>
      </h1>

      {/* Cards Section */}
      <div className="my-10 mt-4 flex flex-wrap gap-5">
        {dashboardCardsData.map((card, index) => (
          <div key={index} className="flex items-center gap-10 rounded-lg border border-slate-200 p-3 px-6">
            <div className="flex flex-col gap-3 text-xs">
              <p>{card.title}</p>
              <b className="text-2xl font-medium text-slate-700">{card.value}</b>
            </div>
            <card.icon size={50} className="h-11 w-11 rounded-full bg-slate-100 p-2.5 text-slate-400" />
          </div>
        ))}
      </div>

      {/* Area Chart */}
      <OrdersAreaChart allOrders={dashboardData.allOrders} />
    </div>
  );
}
