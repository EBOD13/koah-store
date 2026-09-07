import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { TrackingProvider } from "@/components/TrackingProvider";
import { Header } from "@/components/Header";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Koah Store",
  description: "Demo storefront with UTM-based conversion attribution",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <TrackingProvider>
          <Header />
          <main className="flex-1">{children}</main>
        </TrackingProvider>
      </body>
    </html>
  );
}
