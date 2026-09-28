import type { Metadata } from "next";
import "./globals.css";
import { ThemeProvider } from "@/features/workspace/components/theme-provider";

export const metadata: Metadata = {
  title: "Chatzy",
  description: "A production-grade WhatsApp-style messaging dashboard.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased" suppressHydrationWarning>
      <body className="min-h-full flex flex-col">
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
