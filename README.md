# x402 Next.js Starter

Minimal Next.js template showing how to add x402 payment-gated API routes using the [Satoshi Facilitator](https://facilitator.bitcoinsapi.com).

Uses the official [`@x402/next`](https://www.npmjs.com/package/@x402/next) SDK — no hand-rolled protocol code.

## Setup

```bash
npm install
cp .env.example .env   # edit with your wallet address
npm run dev
```

## API Routes

| Route | Auth | Description |
|-------|------|-------------|
| `GET /api/hello` | Free | Returns a greeting |
| `GET /api/premium` | x402 | Returns premium content after payment |

## How it works

The `withX402` wrapper from `@x402/next` handles the full payment flow:

1. Client calls `/api/premium` without the `X-PAYMENT` header
2. `withX402` returns **402 Payment Required** with `PAYMENT-REQUIRED` header (x402 v2 protocol)
3. Client signs a payment with their wallet and retries with `X-PAYMENT`
4. `withX402` verifies the payment via the facilitator, runs your handler, then settles on-chain
5. Client receives premium content + a `PAYMENT-RESPONSE` header with the settlement tx hash

Payment is only settled if the handler returns a 2xx response — failed requests don't charge the user.

## Test with curl

```bash
# Free endpoint
curl http://localhost:3000/api/hello

# Paid endpoint (returns 402 with payment requirements)
curl -i http://localhost:3000/api/premium
```

## Paying programmatically

Use `@x402/fetch` to auto-handle 402 responses:

```typescript
import { wrapFetch } from "@x402/fetch";

const x402Fetch = wrapFetch(fetch, walletClient);
const res = await x402Fetch("http://localhost:3000/api/premium");
const data = await res.json();
```

## Configuration

| Env Var | Default | Description |
|---------|---------|-------------|
| `FACILITATOR_URL` | `https://facilitator.bitcoinsapi.com` | x402 facilitator endpoint |
| `PAY_TO` | `0xe166...` | Your wallet address for receiving payments |
| `PRICE` | `$0.001` | Price in USD |
| `NETWORK` | `eip155:8453` | Chain ID (Base mainnet) |

## Adding more paid routes

```typescript
// app/api/your-route/route.ts
import { NextRequest, NextResponse } from "next/server";
import { withX402 } from "@x402/next";
import { server, PAY_TO, PRICE, NETWORK } from "@/lib/x402";

const handler = async (_: NextRequest) => {
  return NextResponse.json({ data: "your premium content" });
};

export const GET = withX402(
  handler,
  {
    accepts: [{ scheme: "exact", price: PRICE, network: NETWORK, payTo: PAY_TO }],
    description: "Your paid endpoint",
  },
  server,
);
```

## Links

- [x402 Protocol](https://github.com/coinbase/x402)
- [x402 Documentation](https://x402.org)
- [Satoshi Facilitator](https://facilitator.bitcoinsapi.com)

## License

MIT
