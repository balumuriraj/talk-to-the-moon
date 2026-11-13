import { z } from "zod";
import { FunctionTool } from "@arcgis/ai-components/agent-utils/tools/FunctionTool.js";
import { queryCraters, sql } from "../../data";
import type { MoonApp } from "../../map/controller";
import { markCraters } from "../../map/graphics";
import { lunarDistanceKm, offset } from "../../map/scale";
import { inBackground, json, resolve, showCard, surfaceTarget } from "./shared";

/** showCraters, nearestCraters, and showCraterNames. */

const DEFAULT_NEAREST = 10;
const MAX_NEAREST = 25;

const roundToTenth = (n: number) => Math.round(n * 10) / 10;

export function createCraterTools(app: MoonApp) {
  const { moon } = app;

  const showCraters = new FunctionTool({
    name: "showCraters",
    description:
      "Marks and frames exact crater names from queryData, in the given order. Shows a detail card for one crater or a list for several. Doesn't search or interpret names.",
    inputSchema: z.strictObject({
      names: z.array(z.string()).min(1),
      title: z.string().min(1),
    }),
    execute: async ({ names, title }, config) => {
      const requested = [...new Set(names)];
      const found = await queryCraters(
        moon.craters,
        `name IN (${requested.map(sql).join(", ")})`,
      );
      // Keep the order asked for, and fail on any name that doesn't exist.
      const craters = requested.map((name) => {
        const crater = found.find((c) => c.name === name);
        if (!crater)
          throw new Error(
            `No crater named ${name}. Query craters for the exact name.`,
          );
        return crater;
      });
      await app.prepare();
      app.clear();
      markCraters(moon.craterMarks, craters);
      if (craters.length === 1) {
        const [crater] = craters;
        app.state.focus = `${crater.name} crater`;
        await showCard("crater-card", crater, config);
        // Frame the rim's north and south edges, so a big crater fills the view.
        const radiusKm = crater.diameterKm / 2;
        inBackground(
          app.frame([offset(crater, radiusKm), offset(crater, -radiusKm)]),
          "frame the crater",
        );
      } else {
        await showCard(
          "crater-list",
          { title, total: craters.length, items: craters },
          config,
        );
        inBackground(app.frame(craters), "frame the craters");
      }
      return json({
        shownToUser: `${craters.length === 1 ? "crater card" : "crater list card"} and map marks`,
        craters,
      });
    },
  });

  const nearestCraters = new FunctionTool({
    name: "nearestCraters",
    description:
      "Ranks named craters by lunar surface distance from an explicit mission, crater, or place to each crater's center (not its rim). An optional SQL where restricts the candidates; the origin crater itself is left out. Marks the results on the map and lists them in a card.",
    inputSchema: z.strictObject({
      origin: surfaceTarget,
      where: z.string().min(1).default("1=1"),
      limit: z.number().int().min(1).max(MAX_NEAREST).default(DEFAULT_NEAREST),
      title: z.string().min(1),
    }),
    execute: async (
      { origin, where = "1=1", limit = DEFAULT_NEAREST, title },
      config,
    ) => {
      const center = await resolve(app, origin);
      const candidates = await queryCraters(
        moon.craters,
        center.crater
          ? `(${where}) AND name <> ${sql(center.crater.name)}`
          : where,
      );
      const nearest = candidates
        .map((crater) => ({
          ...crater,
          km: roundToTenth(lunarDistanceKm(center, crater)),
        }))
        .sort((a, b) => a.km - b.km)
        .slice(0, limit);
      await app.prepare();
      app.clear();
      markCraters(moon.craterMarks, nearest);
      app.state.focus = center.name;
      await showCard(
        "crater-list",
        { title, total: candidates.length, items: nearest, from: center.name },
        config,
      );
      if (nearest.length)
        inBackground(app.frame([center, ...nearest]), "frame the craters");
      return json({
        shownToUser: "crater list card, craters marked on the map",
        totalMatching: candidates.length,
        center: center.name,
        distanceBasis:
          "Approximate surface distance to crater centers, not rims; named craters only.",
        craters: nearest,
      });
    },
  });

  const showCraterNames = new FunctionTool({
    name: "showCraterNames",
    description:
      "Shows or hides the names of all craters. Off by default; craters in the current answer are labeled anyway.",
    inputSchema: z.strictObject({ visible: z.boolean() }),
    execute: async ({ visible }) => {
      moon.craters.labelsVisible = visible;
      return json({ craterNames: visible ? "shown" : "hidden" });
    },
  });

  return { showCraters, nearestCraters, showCraterNames };
}
