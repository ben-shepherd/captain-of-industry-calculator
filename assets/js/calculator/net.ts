import type { NetEntry, NetStatus } from '../contracts';

/**
 * Compare required resources against what the user already produces
 * and return the surplus or deficit for each resource.
 */
export function calculateNet(
  required: Record<string, number>,
  production: Record<string, number>,
): Record<string, NetEntry> {
  const ids = unionKeys(required, production);
  const result: Record<string, NetEntry> = {};

  for (const id of ids) {
    const req  = required[id]   ?? 0;
    const prod = production[id] ?? 0;
    const net  = prod - req;

    const status: NetStatus =
      net > 0 ? "surplus" : net < 0 ? "deficit" : "balanced";

    result[id] = { required: req, production: prod, net, status };
  }

  return result;
}

function unionKeys(
  a: Record<string, number>,
  b: Record<string, number>,
): string[] {
  const set = new Set([...Object.keys(a), ...Object.keys(b)]);
  return [...set];
}
