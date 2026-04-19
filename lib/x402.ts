import { x402ResourceServer, HTTPFacilitatorClient } from "@x402/core/server";
import { ExactEvmScheme } from "@x402/evm/exact/server";

const FACILITATOR_URL =
  process.env.FACILITATOR_URL || "https://facilitator.bitcoinsapi.com";

const NETWORK = process.env.NETWORK || "eip155:8453";

const facilitatorClient = new HTTPFacilitatorClient({ url: FACILITATOR_URL });

export const server = new x402ResourceServer(facilitatorClient).register(
  NETWORK,
  new ExactEvmScheme(),
);

export const PAY_TO =
  process.env.PAY_TO || "0xe166267c3648b5ca4419f2c58faed8cd4df87d54";
export const PRICE = process.env.PRICE || "$0.001";
export { NETWORK };
