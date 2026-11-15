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

// Every page is rebuilt at most once an hour. The ETL lands new data nightly,
// so this keeps the site fresh without querying on every request.
export const revalidate = 3600;

export const metadata: Metadata = {
  title: "PAK Trade Flow · Port cargo data for Pakistan equity research",
  description:
    "Every vessel call at Port Qasim and Karachi Port, counted once and mapped to listed sectors. Updated nightly, with history back to 2019.",
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
          <div className="pl-72 print:pl-0">
            <div className="print:hidden">
              <TopBar />
            </div>
            <main className="relative bg-background min-h-screen p-xl print:p-0 print:bg-white">
              {children}
            </main>
          </div>
        </LeadGateProvider>
      </body>
    </html>
  );
}
