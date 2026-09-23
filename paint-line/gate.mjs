import { isIPv4, isIPv6 } from "node:net";

/** @typedef {{ version: 4 | 6, parts: bigint[], prefix: number }} ParsedNet */

export function parseAllowNets(raw) {
  /** @type {ParsedNet[]} */
  const nets = [];
  for (const bit of (raw || "").split(",")) {
    let text = bit.trim();
    if (!text) continue;
    if (!text.includes("/")) {
      text += text.includes(":") ? "/128" : "/32";
    }
    const parsed = parseNetwork(text);
    if (parsed) nets.push(parsed);
  }
  return nets;
}

function parseNetwork(cidr) {
  const [addr, prefixText] = cidr.split("/");
  const prefix = Number(prefixText);
  if (!Number.isInteger(prefix)) return null;
  if (isIPv4(addr)) {
    if (prefix < 0 || prefix > 32) return null;
    return { version: 4, parts: [ipv4ToBigInt(addr)], prefix };
  }
  if (isIPv6(addr)) {
    if (prefix < 0 || prefix > 128) return null;
    return { version: 6, parts: expandIpv6(addr), prefix };
  }
  return null;
}

function ipv4ToBigInt(ip) {
  return ip.split(".").reduce((acc, oct) => (acc << 8n) + BigInt(Number(oct)), 0n);
}

function expandIpv6(ip) {
  const halves = ip.split("::");
  const left = halves[0] ? halves[0].split(":").filter(Boolean) : [];
  const right = halves.length > 1 && halves[1] ? halves[1].split(":").filter(Boolean) : [];
  const missing = 8 - left.length - right.length;
  const parts = [...left, ...Array(Math.max(0, missing)).fill("0"), ...right].map((h) =>
    BigInt(`0x${h || "0"}`),
  );
  return parts;
}

function isLoopback(ip) {
  return ip === "127.0.0.1" || ip === "::1" || ip.startsWith("127.");
}

function isLinkLocal(ip) {
  if (isIPv4(ip)) {
    const [a, b] = ip.split(".").map(Number);
    return a === 169 && b === 254;
  }
  return ip.toLowerCase().startsWith("fe80:");
}

export function isPrivateOrLocal(ip) {
  if (!ip || isLoopback(ip) || isLinkLocal(ip)) return true;
  if (isIPv4(ip)) {
    const [a, b] = ip.split(".").map(Number);
    if (a === 10) return true;
    if (a === 172 && b >= 16 && b <= 31) return true;
    if (a === 192 && b === 168) return true;
  }
  if (isIPv6(ip)) {
    const lower = ip.toLowerCase();
    if (lower.startsWith("fc") || lower.startsWith("fd")) return true;
  }
  return false;
}

function ipInNet(ip, net) {
  if (net.version === 4 && isIPv4(ip)) {
    const addr = ipv4ToBigInt(ip);
    const mask = net.prefix === 0 ? 0n : ((1n << 32n) - 1n) << BigInt(32 - net.prefix);
    return (addr & mask) === (net.parts[0] & mask);
  }
  if (net.version === 6 && isIPv6(ip)) {
    const addr = expandIpv6(ip);
    for (let i = 0; i < 8; i++) {
      const bits = Math.min(16, Math.max(0, net.prefix - i * 16));
      if (bits === 0) return true;
      const mask = bits === 16 ? 0xffffn : ((1n << BigInt(bits)) - 1n) << BigInt(16 - bits);
      if ((addr[i] & mask) !== (net.parts[i] & mask)) return false;
    }
    return true;
  }
  return false;
}

export function ipAllowed(ip, nets) {
  if (!nets.length) return true;
  if (!ip) return false;
  if (isPrivateOrLocal(ip)) return true;
  return nets.some((net) => ipInNet(ip, net));
}

export function normalizePeer(peer) {
  return (peer || "").trim().replace(/^::ffff:/, "");
}

/** Real client IP when the request came through cloudflared on loopback. */
export function clientIp(peer, cfConnectingIp, xForwardedFor) {
  const p = normalizePeer(peer);
  const cf = (cfConnectingIp || "").trim();
  if (cf && (!p || isLoopback(p))) return cf;
  const xff = (xForwardedFor || "").trim();
  if (xff && isLoopback(p)) {
    const first = xff.split(",")[0]?.trim();
    if (first) return first;
  }
  return p || null;
}

/**
 * When an allowlist is on, cloudflared connects as 127.0.0.1. Without
 * CF-Connecting-IP / X-Forwarded-For we must not treat that as "local OK".
 */
export function requestAllowed(peer, ip, nets) {
  if (!nets.length) return true;
  if (!ip) return false;
  const p = normalizePeer(peer);
  if (isLoopback(p) && ip === p) return false;
  return ipAllowed(ip, nets);
}
