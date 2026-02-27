import type { Metadata } from "next";
import "./globals.css";
import { LayoutShell } from "@/components/ui/LayoutShell";

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
        <LayoutShell>{children}</LayoutShell>
      </body>
    </html>
  );
}
