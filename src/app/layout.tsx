'use client'

import { Montserrat } from "next/font/google";

import "./globals.css";
import { usePathname } from 'next/navigation'
import { Navigation } from "./components/(Navigation)/navigation";

const montserrat = Montserrat({
  subsets: ["latin"],
  variable: "--font-montserrat",
});

const hiddenRoutes  = [
  '/login',
  '/signup',
  '/reset-password',
  '/forgot-password',
  '/error',
]

export default function RootLayout({children,}: Readonly<{children: React.ReactNode;}>) {
  
  const pathname = usePathname()
  const shouldHideNavbar = hiddenRoutes.includes(pathname) || pathname === '/not-found'

  return (
    <html lang="en">
      <body className={`${montserrat.variable} antialiased flex min-h-screen`}>
        {!shouldHideNavbar && <Navigation />}
        <div className="flex-1 flex flex-col">
          {children}
        </div>
      </body>
    </html>
  );
}