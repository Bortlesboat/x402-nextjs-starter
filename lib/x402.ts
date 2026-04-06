import { NextRequest, NextResponse } from "next/server";

const FACILITATOR_URL =
  process.env.FACILITATOR_URL ||
  "https://x402-facilitator.happysmoke-e4fd0a77.eastus.azurecontainerapps.io";

const PAY_TO =
  process.env.PAY_TO || "0xe166267c3648b5ca4419f2c58faed8cd4df87d54";

const PRICE = process.env.PRICE || "0.001";
const NETWORK = process.env.NETWORK || "eip155:8453";

/** USDC has 6 decimals on Base */
function toUsdcAtomicUnits(humanAmount: string): string {
  const num = parseFloat(humanAmount);
  return Math.round(num * 1e6).toString();
}

/**
 * Build the 402 payment requirements response.
 * Clients use this to know how much to pay and where.
 */
function paymentRequiredResponse(): NextResponse {
  const requirements = {
    x402Version: 1,
    accepts: [
      {
        scheme: "exact",
        network: NETWORK,
        maxAmountRequired: toUsdcAtomicUnits(PRICE),
        resource: PAY_TO,
        description: "Pay to access this endpoint",
        mimeType: "application/json",
        payTo: PAY_TO,
        extra: {
          name: "USDC",
          version: "1",
        },
      },
    ],
    facilitatorUrl: FACILITATOR_URL,
    error: undefined,
  };

  return NextResponse.json(requirements, {
    status: 402,
    headers: { "Content-Type": "application/json" },
  });
}

/**
 * Verify a payment header with the Satoshi Facilitator.
 * Returns { valid: true } or { valid: false, error: string }.
 */
async function verifyPayment(
  paymentHeader: string
): Promise<{ valid: boolean; error?: string }> {
  try {
    const res = await fetch(`${FACILITATOR_URL}/verify`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        payment: paymentHeader,
        payTo: PAY_TO,
        maxAmountRequired: toUsdcAtomicUnits(PRICE),
        network: NETWORK,
        scheme: "exact",
      }),
    });

    if (!res.ok) {
      const text = await res.text();
      return { valid: false, error: `Facilitator returned ${res.status}: ${text}` };
    }

    const data = await res.json();
    return { valid: !!data.valid, error: data.error };
  } catch (err) {
    return {
      valid: false,
      error: `Facilitator unreachable: ${(err as Error).message}`,
    };
  }
}

/**
 * x402 payment gate for Next.js route handlers.
 *
 * Usage in a route:
 *   const { paid, response, settlementHeader } = await requirePayment(request);
 *   if (!paid) return response;
 *   // ... serve premium content, attach settlementHeader to response
 */
export async function requirePayment(req: NextRequest): Promise<{
  paid: boolean;
  response?: NextResponse;
  settlementHeader?: string;
}> {
  const paymentHeader = req.headers.get("X-PAYMENT") || req.headers.get("x-payment");

  if (!paymentHeader) {
    return { paid: false, response: paymentRequiredResponse() };
  }

  const result = await verifyPayment(paymentHeader);

  if (!result.valid) {
    return {
      paid: false,
      response: NextResponse.json(
        { error: result.error || "Payment verification failed" },
        { status: 402 }
      ),
    };
  }

  // Pass the payment header back so the route can include PAYMENT-RESPONSE
  return { paid: true, settlementHeader: paymentHeader };
}

/**
 * Settle a verified payment with the facilitator.
 * Call this AFTER serving content to finalize the transaction.
 */
export async function settlePayment(
  paymentHeader: string
): Promise<{ txHash?: string; error?: string }> {
  try {
    const res = await fetch(`${FACILITATOR_URL}/settle`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        payment: paymentHeader,
        payTo: PAY_TO,
        maxAmountRequired: toUsdcAtomicUnits(PRICE),
        network: NETWORK,
        scheme: "exact",
      }),
    });

    const data = await res.json();
    return { txHash: data.txHash, error: data.error };
  } catch (err) {
    return { error: `Settlement failed: ${(err as Error).message}` };
  }
}
