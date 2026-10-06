import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import { locale, messages } from "@/shared/i18n";
import { TournamentProvider } from "@/features/tournaments/components/TournamentProvider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: messages.metadata.title,
  description: messages.metadata.description,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang={locale} className={geistSans.variable}>
      <body>
        <TournamentProvider>{children}</TournamentProvider>
      </body>
    </html>
  );
}
