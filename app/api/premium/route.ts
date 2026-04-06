import { NextRequest, NextResponse } from "next/server";
import { requirePayment, settlePayment } from "@/lib/x402";

export async function GET(req: NextRequest) {
  // Gate this route behind x402 payment
  const { paid, response, settlementHeader } = await requirePayment(req);

  if (!paid) {
    return response;
  }

  // Settle the payment on-chain
  const settlement = await settlePayment(settlementHeader!);

  // Build the premium response
  const data = {
    message: "Premium content unlocked!",
    timestamp: new Date().toISOString(),
    data: {
      insight: "Bitcoin is the future of money.",
      source: "Satoshi Facilitator x402 payment verified",
    },
  };

  const res = NextResponse.json(data);

  // Attach settlement info for the client
  if (settlement.txHash) {
    res.headers.set("X-PAYMENT-RESPONSE", settlement.txHash);
  }

  return res;
}
