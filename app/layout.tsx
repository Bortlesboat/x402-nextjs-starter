export const metadata = {
  title: "x402 Next.js Starter",
  description: "Minimal Next.js app with x402 payment-gated API routes",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
