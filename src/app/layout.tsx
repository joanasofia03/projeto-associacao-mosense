'use client'

import { Montserrat } from "next/font/google";
import { usePathname } from 'next/navigation';
import "./globals.css";
import Navigation from "./components/(Navigation)/Navigation";

const montserrat = Montserrat({
  subsets: ["latin"],
  variable: "--font-montserrat",
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const pathname = usePathname();
  
  const hideNavBarRoutes = ['/login', '/register']; //Páginas em que a NavBar deve ficar oculta;
  const shouldHideNavigation = hideNavBarRoutes.includes(pathname); //Responsável por ocultar ou não a NavBar;

  return (
    <html lang="en">
      <body
        className={`${montserrat.variable} antialiased ${shouldHideNavigation ? '' : 'flex'}`}
      >
        {!shouldHideNavigation && <Navigation />}
        <div className={`flex flex-col w-full h-full ${shouldHideNavigation ? 'min-h-screen' : ''}`}>
          {children}
        </div>
      </body>
    </html>
  );
}