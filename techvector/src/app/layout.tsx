import type { Metadata } from "next";
import { Geist_Mono } from "next/font/google";
import "./globals.css";
import Link from "next/link";

import Image from "next/image";
import ChatBtnLayout from "@/ui/newChatBtnLayout";


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
          
          <ChatBtnLayout />
        </header>
        {children}
      </body>
    </html>
  );
}
