// To test without blocking, switch any rule's mode to "DRY_RUN"
// DRY_RUN logs the decision but always allows the request through
// Switch back to "LIVE" when ready to enforce

import arcjet, { detectBot, slidingWindow, validateEmail } from "@arcjet/next";

export const aj = arcjet({
  key: process.env.ARCJET_KEY!,
  rules: [
    // Rule 1: Rate Limiting — max 60 requests per minute per IP
    slidingWindow({
      mode: "LIVE",
      interval: "1m",
      max: 60,
    }),

    // Rule 2: Bot Protection — allow only search engines, block all other bots
    detectBot({
      mode: "LIVE",
      allow: ["CATEGORY:SEARCH_ENGINE"],
    }),

    // NOTE: validateEmail is NOT included here because it requires an email
    // characteristic on every request. Use aj.withRule(validateEmail(...)) in
    // specific handlers where you actually have an email to validate.
  ],
});

// Re-export so route handlers can compose: aj.withRule(emailRule).protect(req, { email })
export { validateEmail };
