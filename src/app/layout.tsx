import "~/styles/globals.css";

import { type Metadata } from "next";
import { Geist } from "next/font/google";
import { ConvexClientProvider } from "./ConvexClientProvider";

export const metadata: Metadata = {
  title: "tiqn",
  description: "saving lives, one minute at a time",
  icons: [{ rel: "icon", url: "/favicon.ico" }],
};

const geist = Geist({
  subsets: ["latin"],
  variable: "--font-geist-sans",
});

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${geist.variable}`}>
      <body>
        <ConvexClientProvider>{children}</ConvexClientProvider>
      </body>
    </html>
  );
}
