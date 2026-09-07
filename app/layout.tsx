import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SNAP APP",
  description: "Consent-based snap image sharing platform",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/LOGO.svg",
    apple: "/LOGO.svg",
  },
  openGraph: {
    title: "SNAP APP",
    description: "View shared snap on SNAP APP",
    siteName: "SNAP APP",
    images: [{ url: "/LOGO.svg", width: 800, height: 800, alt: "SNAP APP Ghost Logo" }],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: "#000000",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
      </head>
      <body className="bg-black text-white antialiased min-h-[100dvh] flex flex-col">
        {children}
      </body>
    </html>
  );
}
