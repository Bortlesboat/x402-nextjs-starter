import { NextRequest, NextResponse } from "next/server";
import { withX402 } from "@x402/next";
import { server, PAY_TO, PRICE, NETWORK } from "@/lib/x402";

const handler = async (_: NextRequest) => {
  return NextResponse.json({
    message: "Premium content unlocked!",
    timestamp: new Date().toISOString(),
    data: {
      insight: "Bitcoin is the future of money.",
      source: "Satoshi Facilitator x402 payment verified",
    },
  });
};

export const GET = withX402(
  handler,
  {
    accepts: [
      {
        scheme: "exact",
        price: PRICE,
        network: NETWORK,
        payTo: PAY_TO,
      },
    ],
    description: "Premium content — costs 0.001 USDC per request",
    mimeType: "application/json",
  },
  server,
);
