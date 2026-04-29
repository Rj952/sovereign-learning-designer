import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Sovereign AI Learning Designer · Caribbean Edition",
  description:
    "An integrity-centred AI assignment designer for Caribbean educators. Built on the CARE, CRAFT, and ACRE frameworks. Created by Dr. Rohan Jowallah, Ed.D.",
  authors: [{ name: "Dr. Rohan Jowallah, Ed.D." }],
  creator: "Dr. Rohan Jowallah, Ed.D.",
  keywords: [
    "Caribbean education",
    "AI in education",
    "assignment design",
    "CARE framework",
    "CRAFT framework",
    "ACRE framework",
    "Jamaica",
    "academic integrity",
    "Sovereign AI",
  ],
  openGraph: {
    title: "Sovereign AI Learning Designer",
    description:
      "Design assignments that sharpen thinking, not soften it. For Caribbean educators.",
    type: "website",
    locale: "en_JM",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#006B3C",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en-JM">
      <head>
        <link
          rel="preconnect"
          href="https://fonts.googleapis.com"
        />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,400;0,9..144,500;0,9..144,600;1,9..144,400&family=Public+Sans:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <a href="#main-content" className="skip-link">
          Skip to main content
        </a>
        <div className="flag-accent" aria-hidden="true" />
        {children}
      </body>
    </html>
  );
}
