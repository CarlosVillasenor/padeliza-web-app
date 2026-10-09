import type { Metadata } from "next";
import { Geist } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import { locale, messages } from "@/shared/i18n";
import { TournamentProvider } from "@/features/tournaments/hooks/TournamentProvider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: messages.metadata.title,
  description: messages.metadata.description,
};

/** Provides the document shell, active locale, tournament context, and metadata. */
export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang={locale} className={geistSans.variable}>
      <body>
        <TournamentProvider>{children}</TournamentProvider>
      </body>
      <Script
        src="https://cloud.umami.is/script.js"
        data-website-id="80413473-1c26-4836-8dce-f1c93d3ab68b"
        strategy="afterInteractive"
      />
    </html>
  );
}
