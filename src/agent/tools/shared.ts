import { z } from "zod";
import { isAbortError } from "@arcgis/core/core/promiseUtils.js";
import type { FunctionTool } from "@arcgis/ai-components/agent-utils/tools/FunctionTool.js";
import { sendUXSuggestion } from "@arcgis/ai-components/orchestrator/signals.js";
import type { CardData } from "../../cards/Cards";
import {
  PLACES,
  daysToSurface,
  findCrater,
  findLaunchSite,
  findMission,
  isFarSide,
  type Crater,
  type Mission,
} from "../../data";
import type { MoonApp } from "../../map/controller";
import type { LatLon } from "../../map/scale";

/** Helpers every tool file uses: cards, results, error handling, and typed targets. */

type Config = Parameters<typeof sendUXSuggestion>[1];

/** Send structured data to a chat card (rendered by cards/Cards.tsx). */
export const showCard = <K extends keyof CardData>(
  type: K,
  data: CardData[K],
  config: Config,
) => sendUXSuggestion({ type, data: { ...data } }, config);

/** A tool's result, as the model reads it. */
export const json = (value: unknown) => JSON.stringify(value);

/** Joins the sentences of a tool description, so each one can sit on its own line in the code. */
export const sentences = (...parts: string[]) => parts.join(" ");

/**
 * Hands a tool's error back to the model as its result, so the model can fix its input and try
 * again. Without this, SDK 5.2 treats any error thrown by a tool as fatal and ends the
 * whole request with "I couldn't complete this request."
 */
export function returnErrors<I extends Record<string, unknown>, O>(
  tool: FunctionTool<I, O>,
): FunctionTool<I, O> {
  // Added last, so it wraps only the tool's own work; chooseMission's question to the user stays outside.
  tool.middlewares.push({
    name: "returnErrors",
    handler: async (request, next) => {
      try {
        return await next(request);
      } catch (error) {
        if (isAbortError(error)) throw error;
        return json({
          error: error instanceof Error ? error.message : String(error),
        });
      }
    },
  });
  return tool;
}

/** Camera moves run while the model writes its reply; log failures other than interruptions. */
export const inBackground = (promise: Promise<unknown>, what: string) =>
  void promise.catch((error: unknown) => {
    if (!isAbortError(error)) console.error(`Could not ${what}:`, error);
  });

/** Where a tool acts: the model must say what kind of thing it means, then give its exact id or name. */
export const missionTarget = z.strictObject({
  kind: z.literal("mission"),
  id: z.string().describe("Mission id from queryData"),
});
export const craterTarget = z.strictObject({
  kind: z.literal("crater"),
  name: z.string().describe("Exact crater name from queryData"),
});
export const placeTarget = z.strictObject({
  kind: z.literal("place"),
  id: z
    .enum(PLACES.map((p) => p.id))
    .describe(PLACES.map((p) => `${p.id}: ${p.name}`).join("; ")),
});
/** Any target on the Moon's surface. */
export const surfaceTarget = z.discriminatedUnion("kind", [
  missionTarget,
  craterTarget,
  placeTarget,
]);

/** A resolved target: where it is, plus its record when it's a mission or crater. */
export type Spot = LatLon & { name: string; mission?: Mission; crater?: Crater };

/** Looks up a typed target. Throws an error the model can read if the id or name is unknown. */
export async function resolve(
  app: MoonApp,
  target: z.infer<typeof surfaceTarget>,
): Promise<Spot> {
  switch (target.kind) {
    case "mission": {
      const mission = findMission(app.data, target.id);
      return {
        name: mission.name,
        lat: mission.lat,
        lon: mission.lon,
        mission,
      };
    }
    case "crater": {
      const crater = await findCrater(app.moon.craters, target.name);
      return {
        name: `${crater.name} crater`,
        lat: crater.lat,
        lon: crater.lon,
        crater,
      };
    }
    case "place":
      return PLACES.find((p) => p.id === target.id)!;
  }
}

/** A mission's record with the derived facts the model needs. */
export const missionFacts = (app: MoonApp, m: Mission) => ({
  ...m,
  arrivalDate: new Date(m.arrivalDate).toISOString(),
  launchDate: new Date(m.launchDate).toISOString(),
  launchSite: findLaunchSite(app.data, m.launchSiteId),
  sharedRocketWith: m.rideshare
    ? findMission(app.data, m.rideshare).name
    : undefined,
  daysToSurface: daysToSurface(m),
  side: isFarSide(m) ? "Far side" : "Near side",
});
