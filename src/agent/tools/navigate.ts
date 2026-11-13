import { z } from "zod";
import { FunctionTool } from "@arcgis/ai-components/agent-utils/tools/FunctionTool.js";
import { findLaunchSite, isLanding } from "../../data";
import type { MoonApp } from "../../map/controller";
import { markCraters } from "../../map/graphics";
import {
  craterTarget,
  inBackground,
  json,
  missionFacts,
  missionTarget,
  placeTarget,
  resolve,
  showCard,
} from "./shared";

/** goTo and flyLander: the tools that move the camera. */

/** Map scale for a close-up of a place or a small crater (1:50,000). */
const CLOSE_UP_SCALE = 50_000;
/** The widest a crater close-up goes, so the largest basins still fit (1:3,000,000). */
const WIDEST_CRATER_SCALE = 3_000_000;
/** Map scale per kilometer of crater diameter, so a crater fills most of the view. */
const SCALE_PER_CRATER_KM = 8000;

/** A map scale that frames a crater of this diameter. */
const craterScale = (diameterKm: number) =>
  Math.min(
    Math.max(diameterKm * SCALE_PER_CRATER_KM, CLOSE_UP_SCALE),
    WIDEST_CRATER_SCALE,
  );

export function createNavigationTools(app: MoonApp) {
  const { data, moon } = app;

  const goTo = new FunctionTool({
    name: "goTo",
    description:
      "Moves the camera to an explicitly typed target: a mission id or exact crater name from queryData (with a close-up and its card), a reference place, a launch site on Earth, or the Moon or Earth as a whole. Travels between Earth and the Moon as needed. No free-text name interpretation or type guessing.",
    inputSchema: z.strictObject({
      target: z.discriminatedUnion("kind", [
        missionTarget,
        craterTarget,
        placeTarget,
        z.strictObject({
          kind: z.literal("launchSite"),
          id: z
            .enum(data.launchSites.map((s) => s.id))
            .describe(
              data.launchSites
                .map((s) => `${s.id}: ${s.name}, ${s.place}`)
                .join("; "),
            ),
        }),
        z.strictObject({ kind: z.literal("moon") }),
        z.strictObject({ kind: z.literal("earth") }),
      ]),
    }),
    execute: async ({ target }, config) => {
      if (target.kind === "earth") {
        await app.slider.stop();
        await app.travel.toEarth();
        return json({ world: "earth" });
      }
      if (target.kind === "launchSite") {
        const site = findLaunchSite(data, target.id);
        await app.slider.stop();
        await app.travel.showOnEarth(site);
        return json({ shownToUser: "Earth, turned to the launch site", site });
      }
      if (target.kind === "moon") {
        const alreadyThere = app.travel.world === "moon";
        app.showAllTime();
        // The trip takes about four seconds; let it play while the model replies.
        inBackground(app.travel.toMoon(), "travel to the Moon");
        return json(
          alreadyThere
            ? { alreadyOnMoon: true }
            : {
                from: "Earth",
                to: "Moon",
                animationSeconds: 4,
                distanceKm: 384_400,
                missionsReachingSurface: data.missions.length,
                successfulLandings: data.missions.filter(isLanding).length,
              },
        );
      }

      // A mission, crater, or place on the Moon.
      const spot = await resolve(app, target);
      if (spot.mission) {
        await showCard("mission-card", { id: spot.mission.id }, config);
        inBackground(app.visit(spot.mission), `visit ${spot.name}`);
        return json({
          shownToUser: "close-up and mission card",
          mission: missionFacts(app, spot.mission),
        });
      }
      await app.prepare();
      app.showAllTime();
      app.state.focus = spot.name;
      if (spot.crater) {
        markCraters(moon.craterMarks, [spot.crater]);
        await showCard("crater-card", spot.crater, config);
      }
      const scale = spot.crater
        ? craterScale(spot.crater.diameterKm)
        : CLOSE_UP_SCALE;
      inBackground(app.flyTo(spot, { scale }), `go to ${spot.name}`);
      return json({
        shownToUser: spot.crater ? "close-up and crater card" : "close-up",
        target: spot.name,
        crater: spot.crater,
      });
    },
  });

  const flyLander = new FunctionTool({
    name: "flyLander",
    description:
      "Easter egg: lets the user fly a lunar module around the Moon with the arrow keys, starting where the camera is looking. Only when the user asks to fly or pilot something.",
    inputSchema: z.strictObject({}),
    execute: async () => {
      await app.fly();
      return json({
        flying: true,
        controls:
          "Left and right arrows steer, up and down climb and descend, Esc lands. Any other map request also ends the flight.",
      });
    },
  });

  return { goTo, flyLander };
}
