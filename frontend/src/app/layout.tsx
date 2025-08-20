import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from './contexts/AuthContext';
import GlobalLoader from './components/GlobalLoader';
import Navbar from "./components/navbar";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Hospital General de Real - Gestión de pacientes y admisiones",
  description: "Gestión de pacientes y admisiones para el Hospital General de Real (REAL RP | GTA V)",
  icons: {
    icon: '/hosp-logo.png',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" style={{ colorScheme: 'light' }}>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        style={{ colorScheme: 'light' }}
      >
        <AuthProvider>
          <GlobalLoader />
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
