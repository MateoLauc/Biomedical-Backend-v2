import { createApp } from "../src/app";
import type { Express } from "express";

const createAppTyped = createApp as unknown as () => Express;

export default createAppTyped();

