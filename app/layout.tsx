import type { Metadata, Viewport } from "next";
import { JetBrains_Mono, Nunito } from "next/font/google";
import { themeInitScript } from "@/lib/theme";
import "./globals.css";

/** Nunito (variável): títulos, corpo e valores. Substitui Poppins Rounded (ver docs/DECISIONS.md). */
const nunito = Nunito({
  variable: "--font-nunito",
  subsets: ["latin"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  weight: ["400"],
});

export const metadata: Metadata = {
  title: { default: "Casita", template: "%s · Casita" },
  description: "Sua vida em casa, mais leve.",
  applicationName: "Casita",
  appleWebApp: { title: "Casita", capable: true, statusBarStyle: "default" },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fff8ee" },
    { media: "(prefers-color-scheme: dark)", color: "#1c2620" },
  ],
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="pt-BR"
      suppressHydrationWarning
      className={`${nunito.variable} ${jetbrainsMono.variable} antialiased`}
    >
      <head>
        {/* Aplica o tema salvo antes da primeira pintura (sem flash). */}
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
