import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import { TournamentProvider } from "@/features/tournaments/components/TournamentProvider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Padeliza",
  description: "Crea y administra tus torneos de pádel.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="es" className={geistSans.variable}>
      <body>
        <TournamentProvider>{children}</TournamentProvider>
      </body>
    </html>
  );
}
