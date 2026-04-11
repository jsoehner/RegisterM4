import type { ReactNode } from "react";
import "./styles.css";

export const metadata = {
  title: "Scheduled Registration Assistant",
  description: "Configure credentials, verify access, and schedule registration attempts."
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
