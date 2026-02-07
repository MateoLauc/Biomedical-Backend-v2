import crypto from "node:crypto";

/**
 * Stable fingerprint for a device from IP + user agent (for new-device detection).
 */
export function deviceHash(ip: string | undefined, userAgent: string | undefined): string {
  const normalized = [ip ?? "", (userAgent ?? "").trim()].join("|");
  return crypto.createHash("sha256").update(normalized).digest("hex");
}

/**
 * Human-readable device description for emails (from user-agent).
 * Falls back to "Unknown device" if empty.
 */
export function deviceDescription(userAgent: string | undefined): string {
  const ua = (userAgent ?? "").trim();
  if (!ua) return "Unknown device";

  // Simple parsing: look for browser and OS patterns
  let browser = "Browser";
  let os = "Device";

  if (ua.includes("Chrome") && !ua.includes("Edg")) browser = "Chrome";
  else if (ua.includes("Firefox")) browser = "Firefox";
  else if (ua.includes("Safari") && !ua.includes("Chrome")) browser = "Safari";
  else if (ua.includes("Edg")) browser = "Edge";

  if (ua.includes("Windows")) os = "Windows";
  else if (ua.includes("Mac OS") || ua.includes("Macintosh")) os = "macOS";
  else if (ua.includes("Linux")) os = "Linux";
  else if (ua.includes("Android")) os = "Android";
  else if (ua.includes("iPhone") || ua.includes("iPad")) os = "iOS";

  return `${browser} on ${os}`;
}
