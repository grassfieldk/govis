import type { Metadata } from "next";
import "./globals.css";
import Header from "@/components/header";

export const metadata: Metadata = {
  title: "GOVIS",
  description: "Govemment Visualization",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja" suppressHydrationWarning>
      <body>
        <Header />
        <div className="container min-h-screen mx-auto m-4 p-4">
          <main>{children}</main>
        </div>
      </body>
    </html>
  );
}
