import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Chatzy — closer, every day",
  description: "A little more human. A lot more connected.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en" data-theme="dark"><body>{children}</body></html>;
}
