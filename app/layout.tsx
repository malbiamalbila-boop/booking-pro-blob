
export const metadata = { title: "Booking Pro – Vercel Blob (public)" };
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="sv">
      <body>
        <main className="container">
          <header className="flex items-center justify-between my-2">
            <h1 className="text-2xl font-semibold">🚗 Booking Pro</h1>
            <nav className="text-sm opacity-70">Intern biluthyrning</nav>
          </header>
          {children}
        </main>
      </body>
    </html>
  );
}
