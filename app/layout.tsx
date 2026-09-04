import type { Metadata } from "next";
import { Chivo, Inter, JetBrains_Mono } from "next/font/google";
import { ThemeProvider } from "@components/theme-provider";
import { Toaster } from "@components/ui/sonner";
import { TrpcProvider } from "@/lib/trpc";
import { cn } from "@/lib/utils";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], weight: ["400", "500", "600", "700"], variable: "--font-sans" });

const chivo = Chivo({
  subsets: ["latin"],
  weight: ["400", "600", "700", "900"],
  variable: "--font-chivo",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  variable: "--font-jetbrains",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://volleyball4-2.com"),
  title: {
    default: "Volleyball 4-2 League",
    template: "%s · Volleyball 4-2 League",
  },
  description:
    "Seasons, teams, players, games, stats, records and awards for the Volleyball 4-2 league.",
  openGraph: {
    type: "website",
    siteName: "Volleyball 4-2 League",
    locale: "en_US",
  },
  twitter: { card: "summary_large_image" },
  icons: { icon: "/rvlLogo.png" },
};

export const viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#08090b" },
  ],
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={cn("font-sans", inter.variable, chivo.variable, jetbrainsMono.variable)}
    >
      <body className="min-h-screen overflow-x-hidden bg-background text-foreground antialiased">
        <ThemeProvider>
          <TrpcProvider>{children}</TrpcProvider>
          <Toaster richColors position="top-right" />
        </ThemeProvider>
      </body>
    </html>
  );
}
