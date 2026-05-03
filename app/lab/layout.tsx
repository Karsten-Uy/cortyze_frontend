import type { Metadata } from "next";
import { Inter, JetBrains_Mono, Fraunces } from "next/font/google";

import "./lab.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

const jbm = JetBrains_Mono({
  variable: "--font-jbm",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
});

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  weight: ["300", "400", "500"],
});

export const metadata: Metadata = {
  title: "Cortyze — Neural Audit",
  description: "Score ads on 8 brain regions and get suggestions to lift them.",
};

/**
 * Lab-specific layout. Wraps children in `.lab-root` so the design's
 * CSS variables, fonts, and component styles are scoped here and don't
 * leak into the rest of the app.
 */
export default function LabLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={`${inter.variable} ${jbm.variable} ${fraunces.variable} lab-root`}>
      {children}
    </div>
  );
}
