import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import { Sidebar } from "@/components/layout/Sidebar";
import { TopBar } from "@/components/layout/TopBar";
import { LeadGateProvider } from "@/components/gating/LeadGateProvider";
import {
  getAllCommodityFlow,
  getPortComparison,
  getHeroKpis,
  getCategoryTotals,
} from "@/lib/data/commodityFlow";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
});

export const metadata: Metadata = {
  title: "PAK Trade Flow",
  description:
    "Commodity flow and trade intelligence for Pakistan's deep-water ports.",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const rows = await getAllCommodityFlow();
  const portComparison = getPortComparison(rows);
  const { latestReportDate } = getHeroKpis(rows);
  const categories = getCategoryTotals(rows)
    .filter((c) => c.totalMt > 0)
    .map((c) => c.category);

  return (
    <html lang="en" className={`${inter.variable} ${jetbrainsMono.variable}`}>
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@24,400,0,0&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-background font-body-md text-on-surface">
        <LeadGateProvider categories={categories}>
          <Sidebar portComparison={portComparison} latestReportDate={latestReportDate} />
          <div className="pl-72">
            <TopBar />
            <main className="relative bg-background min-h-screen p-xl">
              {children}
            </main>
          </div>
        </LeadGateProvider>
      </body>
    </html>
  );
}
