import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const LOGO_PATH = path.join(__dirname, "assets", "logo.png");

export type LogoAttachment = {
  filename: string;
  content_id: string;
  disposition: "inline";
  content: Buffer;
};

let cached: LogoAttachment | null | undefined = undefined;

/**
 * Returns null if the file is missing.
 */
export function getLogoAttachment(): LogoAttachment | null {
  if (cached !== undefined) return cached;
  try {
    const content = fs.readFileSync(LOGO_PATH);
    cached = {
      filename: "logo.png",
      content_id: "logo",
      disposition: "inline",
      content
    };
    return cached;
  } catch {
    cached = null;
    return null;
  }
}
