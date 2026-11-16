import type { Metadata } from "next";
import { Bricolage_Grotesque, Caveat } from "next/font/google";
import { Hero } from "@/components/Hero";
import "./globals.css";

const bricolage = Bricolage_Grotesque({
  variable: "--font-bricolage",
  subsets: ["latin"],
  weight: ["400", "600", "800"],
});

const caveat = Caveat({
  variable: "--font-caveat",
  subsets: ["latin"],
  weight: ["500", "700"],
});

export const metadata: Metadata = {
  title: "Andreas ønsker seg",
  description: "Ønskeliste til bursdag 2. desember og jul. Se lista og reserver en gave anonymt.",
  openGraph: { title: "Andreas ønsker seg", locale: "nb_NO", type: "website" },
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="nb" className={`${bricolage.variable} ${caveat.variable}`}>
      <body>
        <Hero />
        <main className="main">{children}</main>
      </body>
    </html>
  );
}
