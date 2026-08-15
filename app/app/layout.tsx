import type { Metadata } from "next";
import { Geist } from "next/font/google";
import { Toaster } from "@components/ui/sonner";
import { TrpcProvider } from "@/lib/trpc";
import { cn } from "@/lib/utils";
import "./globals.css";

const geist = Geist({ subsets: ["latin"], variable: "--font-sans" });

export const metadata: Metadata = {
  metadataBase: new URL("https://volleyball4-2.com"),
  title: {
    default: "Volleyball 4-2 League",
    template: "%s — Volleyball 4-2 League",
  },
  description:
    "Seasons, teams, players, games, stats, records and awards for the Volleyball 4-2 league.",
  openGraph: {
    type: "website",
    siteName: "Volleyball 4-2 League",
    locale: "en_US",
  },
  twitter: { card: "summary_large_image" },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={cn("font-sans", geist.variable)}>
      <body className="min-h-screen bg-background text-foreground antialiased">
        <TrpcProvider>{children}</TrpcProvider>
        <Toaster richColors position="top-right" />
      </body>
    </html>
  );
}
