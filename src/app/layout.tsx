import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Wealth - AI Finance Platform",
  description: "AI-powered finance platform to track wealth, receipts, and budgets.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="en" className="dark" style={{ colorScheme: "dark" }}>
        <body className={`${inter.className} min-h-screen bg-background text-foreground antialiased`}>
          {children}
        </body>
      </html>
    </ClerkProvider>
  );
}
