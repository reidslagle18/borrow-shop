import type { Metadata, Viewport } from "next";
import { Cormorant_Garamond, Karla } from "next/font/google";
import "./globals.css";

const cormorant = Cormorant_Garamond({
  variable: "--font-cormorant",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
});

const karla = Karla({
  variable: "--font-karla",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://borrowfayetteville.com"),
  title: "BORROW · Rent your outfit, save the stress",
  description:
    "Curated dress rentals for every formal, date party, wedding guest and game day. Pick your dress, book your week, return it when the weekend's over.",
  openGraph: {
    title: "BORROW · Rent your outfit, save the stress",
    description:
      "A curated closet for formals, date parties, wedding guests, game days, and more, yours for the week.",
    type: "website",
    images: ["/store/space.jpg"],
  },
  twitter: {
    card: "summary_large_image",
    title: "BORROW · Rent your outfit, save the stress",
    description:
      "A curated closet for formals, date parties, wedding guests, game days, and more, yours for the week.",
    images: ["/store/space.jpg"],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${cormorant.variable} ${karla.variable} h-full antialiased`}
    >
      <body className="min-h-full">{children}</body>
    </html>
  );
}
