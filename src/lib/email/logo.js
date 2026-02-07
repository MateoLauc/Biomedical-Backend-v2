import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const LOGO_PATH = path.join(__dirname, "assets", "logo.png");
let cached = undefined;
/**
 * Returns null if the file is missing.
 */
export function getLogoAttachment() {
    if (cached !== undefined)
        return cached;
    try {
        const content = fs.readFileSync(LOGO_PATH);
        cached = {
            filename: "logo.png",
            content_id: "logo",
            disposition: "inline",
            content
        };
        return cached;
    }
    catch {
        cached = null;
        return null;
    }
}
