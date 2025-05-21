import "./globals.css";

export const metadata = {
  title: "Obituary Page",
  description: "Honoring the life of a beloved individual",
};

export default function RootLayout({ children }) {
  return (
    <html lang="ko">
      <body className="bg-gray-100">{children}</body>
    </html>
  );
}
