#!/usr/bin/env node
/* c8 ignore start */
import { boot } from "./server/boot.js";

boot().catch((error: unknown) => {
  console.error("Fatal error in boot():", error);
  process.exit(1);
});
/* c8 ignore stop */
