import { requiredEnv } from "./lib/required-env.mjs";

// Validate on build, dev, and start, before a request can reach a paid route.
requiredEnv("FACILITATOR_URL");
requiredEnv("PAY_TO");

export default {};
