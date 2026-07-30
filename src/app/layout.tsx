import type { Metadata } from "next";
import { Fraunces, Figtree } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { TrackPageView } from "@/components/TrackPageView";
import "./globals.css";

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  display: "swap",
});

const figtree = Figtree({
  variable: "--font-figtree",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Armed Colorado",
    template: "%s · Armed Colorado",
  },
  description:
    "Colorado firearms law reference: Billwatch, 2A litigation tracker, SB25-003, civic action, and resource directory.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${fraunces.variable} ${figtree.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col bg-navy-deep text-cream">
        <SiteHeader />
        {children}
        <SiteFooter />
        <TrackPageView />
        <Analytics />
      </body>
    </html>
  );
}
