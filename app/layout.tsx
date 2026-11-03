import type { Metadata, Viewport } from "next";
import { Instrument_Serif, Hanken_Grotesk, Pinyon_Script } from "next/font/google";
import "./globals.css";

// Display: an airy, high-contrast editorial serif (distinctive, not a template
// default). Body: a warm, friendly grotesk. Accent: a refined script used only
// for tiny signature moments.
const instrument = Instrument_Serif({
  variable: "--font-instrument",
  subsets: ["latin"],
  weight: ["400"],
  style: ["normal", "italic"],
});

const hanken = Hanken_Grotesk({
  variable: "--font-hanken",
  subsets: ["latin"],
});

const pinyon = Pinyon_Script({
  variable: "--font-pinyon",
  subsets: ["latin"],
  weight: ["400"],
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
      className={`${instrument.variable} ${hanken.variable} ${pinyon.variable} h-full antialiased`}
    >
      <body className="min-h-full">{children}</body>
    </html>
  );
}
