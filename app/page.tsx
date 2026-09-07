export default function Home() {
  return (
    <main style={{ padding: "2rem", fontFamily: "monospace" }}>
      <h1>x402 Next.js Starter</h1>
      <p>API routes with x402 payment gating through your configured facilitator.</p>
      <ul>
        <li>
          <code>GET /api/hello</code> - Free endpoint
        </li>
        <li>
          <code>GET /api/premium</code> - Paid endpoint (0.001 USDC)
        </li>
      </ul>
    </main>
  );
}
