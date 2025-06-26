'use client'

import { Montserrat } from "next/font/google";

import "./globals.css";
import { Navigation } from "./components/navigation";

const montserrat = Montserrat({
  subsets: ["latin"],
  variable: "--font-montserrat",
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {

  return (
    <html lang="en">
      <body className={`${montserrat.variable} antialiased flex min-h-screen`}>
        <Navigation />
        <div className="flex-1 flex flex-col">
          {children}
        </div>
      </body>
    </html>
  );
}