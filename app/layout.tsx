import type { Metadata } from "next";
import { DM_Sans, Space_Grotesk } from "next/font/google";
import { headers } from "next/headers";
import "./globals.css";

const bodyFont = DM_Sans({
  variable: "--font-body",
  subsets: ["latin"],
});

const displayFont = Space_Grotesk({
  variable: "--font-display",
  subsets: ["latin"],
});

export async function generateMetadata(): Promise<Metadata> {
  const requestHeaders = await headers();
  const host = requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host") ?? "localhost:3000";
  const protocol = requestHeaders.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  const metadataBase = new URL(`${protocol}://${host}`);

  return {
    metadataBase,
    title: "LensQuest — Photo Location Survival",
    description:
      "Battle a bot by identifying where real landscape and street photographs were taken.",
    openGraph: {
      title: "LensQuest — Photo Location Survival",
      description: "See the frame. Survive the world.",
      type: "website",
      images: [{ url: "/og.png", width: 1672, height: 941, alt: "LensQuest photo location survival game" }],
    },
    twitter: {
      card: "summary_large_image",
      title: "LensQuest — Photo Location Survival",
      description: "See the frame. Survive the world.",
      images: ["/og.png"],
    },
  };
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className={`${bodyFont.variable} ${displayFont.variable}`}>{children}</body>
    </html>
  );
}
