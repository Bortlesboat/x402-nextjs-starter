# x402 Next.js Starter

Minimal Next.js template showing how to add x402 payment-gated API routes through your configured facilitator.

Uses the official [`@x402/next`](https://www.npmjs.com/package/@x402/next) SDK â€” no hand-rolled protocol code.

## Setup

`FACILITATOR_URL` and `PAY_TO` are required. Set an operating x402 facilitator that supports your chosen network and your own receiving wallet. Missing, empty, or whitespace-only values stop startup with a named configuration error. Surrounding whitespace is trimmed.

The previously advertised Satoshi Facilitator is paused. These templates no longer default to it or to an example recipient.

```bash
npm install
cp .env.example .env   # edit both FACILITATOR_URL and PAY_TO
npm run dev
```

Both required values must also be set before `npm run build` and `npm start`.

## API Routes

| Route | Auth | Description |
|-------|------|-------------|
| `GET /api/hello` | Free | Returns a greeting |
| `GET /api/premium` | x402 | Returns premium content after payment |

## How it works

The `withX402` wrapper from `@x402/next` handles the full payment flow:

1. Client calls `/api/premium` without the `PAYMENT-SIGNATURE` header
2. `withX402` returns **402 Payment Required** with `PAYMENT-REQUIRED` header (x402 v2 protocol)
3. Client signs a payment with their wallet and retries with `PAYMENT-SIGNATURE`
4. `withX402` verifies the payment via the facilitator, runs your handler, then settles on-chain
5. Client receives premium content + a `PAYMENT-RESPONSE` header with the settlement tx hash

Payment is only settled if the handler returns a 2xx response â€” failed requests don't charge the user.

## Test with curl

```bash
# Free endpoint
curl http://localhost:3000/api/hello

# Paid endpoint (returns 402 with payment requirements)
curl -i http://localhost:3000/api/premium
```

## Paying programmatically

Use the official [`@x402/fetch` client](https://github.com/coinbase/x402/tree/main/typescript/packages/http/fetch) with a registered network signer to handle payment-required responses.

## Configuration

| Env Var | Default | Description |
|---------|---------|-------------|
| `FACILITATOR_URL` | Required, no default | Operating x402 facilitator endpoint |
| `PAY_TO` | Required, no default | Your receiving wallet address |
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

## Tests

The tests use a local facilitator fixture and a dummy recipient. They verify configuration errors, the free 200 response, and an unpaid 402 response containing the configured recipient, amount, and network. They do not sign, verify, or settle a payment.

```bash
npm test
```

The HTTP smoke test builds and starts the production app with local fixture configuration.

## Links

- [x402 Protocol](https://github.com/coinbase/x402)
- [x402 Documentation](https://x402.org)
- [Satoshi Facilitator source (hosted service paused)](https://github.com/Bortlesboat/x402-facilitator)

## License

MIT
