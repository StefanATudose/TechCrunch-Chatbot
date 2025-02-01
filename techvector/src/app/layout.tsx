import type { Metadata } from "next";
import { Geist_Mono } from "next/font/google";
import "./globals.css";
import Link from "next/link";
import { IoChatbubbleEllipsesOutline } from "react-icons/io5";
import Image from "next/image";


const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "TechVector",
  description: "AI-powered TechCrunch",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />

      </head>

      <body
        className={`${geistMono.variable} antialiased`}
      >
        <header className="flex justify-between p-2 h-[12vh]">
          <Link href = "/"> 
            <Image className="inline size-full aspect-auto" src="/TV_logo.png" alt="TechVector" width={200} height={200} />
          </Link>
          
          <Link href = "/chat"> 
            <IoChatbubbleEllipsesOutline className="inline size-16"/>
          </Link>
        </header>
        {children}
      </body>
    </html>
  );
}
