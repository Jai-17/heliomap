import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "HelioMaps",
  description: "Calculates BIPV potential",
  openGraph: {
    type: "website",
    siteName: "Helio Maps",
    title: "Helio Maps",
    url: `https://nextjs-cesium.vercel.app`,
    description: "A project that calculates BIPV potential for LOD-1 models and helps in better visualization",
    images: [{
      url: `https://nextjs-cesium.vercel.app/og.png`
    }]
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}