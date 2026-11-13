import { isAbortError } from "@arcgis/core/core/promiseUtils.js";

/** A camera move that was interrupted by a newer one isn't a failure; anything else still throws. */
export const ignoreAbort = (error: unknown) => {
  if (!isAbortError(error)) throw error;
};

/** Whether the user asked the OS for less animation. */
export const reducedMotion = () =>
  matchMedia("(prefers-reduced-motion: reduce)").matches;
