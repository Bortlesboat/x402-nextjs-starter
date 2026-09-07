/** @param {string} name */
export function requiredEnv(name) {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`${name} is required; set it in .env before starting the server`);
  }
  return value;
}
