'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function StoreDashboardRedirect() {
    const router = useRouter()

    useEffect(() => {
        // Redirect to the main store page since the dashboard is there
        router.replace('/store')
    }, [router])

    return (
        <div className="min-h-[80vh] flex flex-col items-center justify-center text-slate-400">
            <h1 className="text-xl">Redirecting to dashboard...</h1>
        </div>
    )
}