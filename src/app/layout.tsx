import type { Metadata } from "next";
import Link from "next/link";
import { Poppins } from "next/font/google";
import "./globals.css";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-poppins",
});

export const metadata: Metadata = {
  title: "LumenX Studio · SEO Intelligence Platform",
  description: "One operating system for SEO agencies, by LumenX Studio",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={poppins.variable}>
      <body className="font-sans">
        <div className="flex min-h-screen">
          <aside className="w-60 shrink-0 border-r border-line p-5 hidden md:flex md:flex-col">
            <div className="mb-8">
              <img src="/logo.png" alt="LumenX Studio" className="w-full rounded-lg bg-white p-2" />
            </div>
            <nav className="space-y-1 text-sm">
              <Link href="/" className="block rounded-lg px-3 py-2 hover:bg-panel">Agency overview</Link>
              <Link href="/clients" className="block rounded-lg px-3 py-2 hover:bg-panel">Clients</Link>
              <Link href="/api/auth/signin" className="block rounded-lg px-3 py-2 hover:bg-panel">Sign in with Google</Link>
              <Link href="/api/auth/signout" className="block rounded-lg px-3 py-2 hover:bg-panel">Sign out</Link>
            </nav>
            <p className="mt-auto pt-8 text-[11px] tracking-widest uppercase text-slate-500">
              Digital marketing agency
            </p>
          </aside>
          <main className="flex-1 p-6 md:p-10 max-w-6xl">{children}</main>
        </div>
      </body>
    </html>
  );
}
