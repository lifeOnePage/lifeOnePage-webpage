// app/layout.js
import "./globals.css";
import { UserProvider } from "./contexts/UserContext";

export default function RootLayout({ children }) {
  return (
    <html lang="ko">
      <body>
        <UserProvider>{children}</UserProvider>
      </body>
    </html>
  );
}
