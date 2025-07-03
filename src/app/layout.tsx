import { Montserrat } from "next/font/google";
import "./globals.css";
import { NavigationServer } from "./components/(Navigation)/NavigationServer";

const montserrat = Montserrat({
  subsets: ["latin"],
  variable: "--font-montserrat",
});

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={`${montserrat.variable} antialiased`}>
        <div className="flex min-h-screen">
          <NavigationServer />
          <div className="flex-1 flex flex-col">
            {children}
          </div>
        </div>
      </body>
    </html>
  )
}