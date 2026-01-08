import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Quizz - Admin Dashboard",
  description: "Quizz application admin dashboard",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>{children}</body>
    </html>
  );
}
