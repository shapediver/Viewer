import {z} from "zod";

// Zod's default JIT/eval capability probe uses new Function("") which is
// reported as a CSP violation in strict environments without 'unsafe-eval'.
// Configure Zod before any schemas are created in this package.
z.config({jitless: true});

export {z};
