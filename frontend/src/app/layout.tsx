import type { Metadata } from "next";
import "./globals.css";
import { Sidebar } from "@/components/ui/Sidebar";

export const metadata: Metadata = {
  title: "Society of Researchers",
  description: "Multi-agent research pipeline with structured debate",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="font-sans antialiased">
        <div className="flex min-h-screen">
          <Sidebar />
          <main className="flex-1 ml-60 bg-slate-50 min-h-screen">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
