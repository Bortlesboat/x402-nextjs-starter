# x402 Next.js Starter

Minimal Next.js template showing how to add x402 payment-gated API routes using the [Satoshi Facilitator](https://x402-facilitator.happysmoke-e4fd0a77.eastus.azurecontainerapps.io).

## Setup

```bash
npm install
cp .env.example .env   # edit with your wallet address + facilitator URL
npm run dev
```

## API Routes

| Route | Auth | Description |
|-------|------|-------------|
| `GET /api/hello` | Free | Returns a greeting |
| `GET /api/premium` | x402 | Returns premium content after payment |

## How it works

1. Client calls `/api/premium` without payment headers
2. Server returns **402** with `paymentRequirements` JSON (amount, network, payTo, facilitator URL)
3. Client obtains a signed payment from a wallet (or x402-enabled fetch client)
4. Client retries with `X-PAYMENT` header containing the signed payment
5. Server verifies the payment with the Satoshi Facilitator's `/verify` endpoint
6. Server serves content and settles the payment via `/settle`

## Test with curl

```bash
# Free endpoint
curl http://localhost:3000/api/hello

# Paid endpoint (returns 402 with payment requirements)
curl -i http://localhost:3000/api/premium

# With a valid payment header (from x402 client/wallet)
curl -H "X-PAYMENT: <signed-payment>" http://localhost:3000/api/premium
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
| `FACILITATOR_URL` | Satoshi Facilitator | x402 facilitator endpoint |
| `PAY_TO` | `0xe166...` | Your wallet address for receiving payments |
| `PRICE` | `0.001` | Price in USDC (human-readable) |
| `NETWORK` | `eip155:8453` | Chain ID (Base mainnet) |

## Adding more paid routes

```typescript
import { requirePayment, settlePayment } from "@/lib/x402";

export async function GET(req: NextRequest) {
  const { paid, response, settlementHeader } = await requirePayment(req);
  if (!paid) return response;

  await settlePayment(settlementHeader!);
  return NextResponse.json({ data: "your premium content" });
}
```

## License

MIT
