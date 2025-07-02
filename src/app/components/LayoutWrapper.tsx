'use client'

import { usePathname } from 'next/navigation'
import { Navigation } from './(Navigation)/NavigationClient'

const hiddenRoutes = [
    '/login',
    '/signup',
    '/reset-password',
    '/forgot-password',
    '/error',
]

export function LayoutWrapper({ children }: { children: React.ReactNode }) {
    const pathname = usePathname()
    const shouldHideNavbar = hiddenRoutes.includes(pathname) || pathname === '/not-found'

    return (
        <div className="flex min-h-screen">
            {!shouldHideNavbar && <Navigation />}
            <div className="flex-1 flex flex-col">
                {children}
            </div>
        </div>
    )
}