import { x402ResourceServer, HTTPFacilitatorClient } from "@x402/core/server";
import type { Network } from "@x402/core/types";
import { ExactEvmScheme } from "@x402/evm/exact/server";
import { requiredEnv } from "./required-env.mjs";

const FACILITATOR_URL = requiredEnv("FACILITATOR_URL");

const NETWORK = (process.env.NETWORK || "eip155:8453") as Network;

const facilitatorClient = new HTTPFacilitatorClient({ url: FACILITATOR_URL });

export const server = new x402ResourceServer(facilitatorClient).register(
  NETWORK,
  new ExactEvmScheme(),
);

export const PAY_TO = requiredEnv("PAY_TO");
export const PRICE = process.env.PRICE || "$0.001";
export { NETWORK };
