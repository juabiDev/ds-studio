import { Barlow, Barlow_Condensed, Playfair_Display } from "next/font/google";

// Self-hosted at build time by next/font: no render-blocking request to Google Fonts.
const display = Playfair_Display({
  subsets: ["latin"],
  weight: ["700", "900"],
  style: ["normal", "italic"],
  variable: "--font-playfair",
  display: "swap",
});

const body = Barlow({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  variable: "--font-barlow",
  display: "swap",
});

const condensed = Barlow_Condensed({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-barlow-condensed",
  display: "swap",
});

export const fontVariables = `${display.variable} ${body.variable} ${condensed.variable}`;
