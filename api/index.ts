import { createApp } from "../src/app.js";
import type { Express } from "express";

const createAppTyped = createApp as unknown as () => Express;

export default createAppTyped();

