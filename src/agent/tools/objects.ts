import { z } from "zod";
import { FunctionTool } from "@arcgis/ai-components/agent-utils/tools/FunctionTool.js";
import type { Crater } from "../../data";
import type { MoonApp } from "../../map/controller";
import {
  SHAPES,
  markCraters,
  placeObject,
  typicalWidthM,
} from "../../map/graphics";
import { offset } from "../../map/scale";
import { inBackground, json, resolve, showCard, surfaceTarget } from "./shared";

/** placeObject and clearMap: true-scale objects, and removing what the guide drew. */

/** Size limits, so a wrong figure from the model can't fill the globe. */
const MAX_HEIGHT_M = 20_000;
const MAX_WIDTH_M = 100_000;

/** An object beside a lander stands at least this far east of it, so the two don't overlap. */
const MIN_GAP_FROM_LANDER_KM = 0.3;
/** Craters at least this wide have a central peak. */
const CENTRAL_PEAK_FROM_KM = 15;
/** In those, stand the object this share of the diameter south of center, on the flat floor. */
const SOUTH_OF_CENTER = 0.15;

/** Map scale per kilometer of crater diameter, when the object stands in a crater. */
const SCALE_PER_CRATER_KM = 6000;
/** Beyond this diameter the view stops widening, so the object can still be seen. */
const WIDEST_FRAMED_CRATER_KM = 60;
/** Map scale per meter of the object's size, when it stands on its own. */
const SCALE_PER_OBJECT_M = 24;
const CLOSEST_SCALE = 2_500;
/** Camera tilt in degrees: low enough to see the object's height. */
const TILT = 72;
/** South of this latitude the camera faces south instead of north. */
const FACE_SOUTH_BELOW_LAT = -60;

/** A map scale that shows the object, and its crater when the crater is small. */
const frameScale = (heightM: number, widthM: number, crater?: Crater) =>
  crater
    ? Math.min(crater.diameterKm, WIDEST_FRAMED_CRATER_KM) * SCALE_PER_CRATER_KM
    : Math.max(Math.max(heightM, widthM) * SCALE_PER_OBJECT_M, CLOSEST_SCALE);

export function createObjectTools(app: MoonApp) {
  const { moon } = app;

  const placeObjectTool = new FunctionTool({
    name: "placeObject",
    description:
      "Stands any real object (a building, monument, mountain, rocket, ...) at true scale at an explicit mission, crater, or place, and frames it. Give its real size in meters from widely published figures and the closest shape; it's drawn as an outline, not a model. Compares its height with a crater's diameter; crater depths are unavailable.",
    inputSchema: z.strictObject({
      name: z.string().min(1),
      heightM: z.number().min(0.1).max(MAX_HEIGHT_M),
      widthM: z
        .number()
        .min(0.1)
        .max(MAX_WIDTH_M)
        .optional()
        .describe("Footprint width; omit for the shape's typical proportions"),
      shape: z
        .enum(SHAPES)
        .describe(
          "tower: tall and tapering; mountain: a wide cone; block: a building or stadium; cylinder: a rocket or tank; sphere: a dome or ball",
        ),
      target: surfaceTarget,
    }),
    execute: async (
      { name, heightM, shape, widthM = typicalWidthM(shape, heightM), target },
      config,
    ) => {
      const spot = await resolve(app, target);
      const { crater } = spot;
      await app.prepare();
      app.showAllTime();

      // Where it stands: east of a lander, or on a crater's flat floor (the camera looks north).
      const hasCentralPeak =
        crater !== undefined && crater.diameterKm >= CENTRAL_PEAK_FROM_KM;
      const at = spot.mission
        ? offset(spot, 0, Math.max(MIN_GAP_FROM_LANDER_KM, widthM / 1000))
        : offset(
            spot,
            hasCentralPeak ? -crater.diameterKm * SOUTH_OF_CENTER : 0,
          );
      placeObject(
        moon.objects,
        shape,
        heightM,
        widthM,
        at,
        `${name}, ${heightM.toLocaleString("en-US")} m`,
      );
      markCraters(moon.craterMarks, crater ? [crater] : []);
      app.state.focus = spot.name;

      const card = {
        name,
        heightM,
        widthM,
        at: spot.name,
        craterDiameterKm: crater ? Math.round(crater.diameterKm) : undefined,
        craterWiderThanTallBy: crater
          ? Math.round((crater.diameterKm * 1000) / heightM)
          : undefined,
      };
      await showCard("object-card", card, config);
      inBackground(
        app.flyTo(at, {
          scale: frameScale(heightM, widthM, crater),
          tilt: TILT,
          heading: spot.lat < FACE_SOUTH_BELOW_LAT ? 180 : 0,
        }),
        "frame the object",
      );
      return json({
        shownToUser: "true-scale outline and comparison card",
        sizeSource: "the guide's general knowledge, not this app's data",
        ...card,
      });
    },
  });

  const clearMap = new FunctionTool({
    name: "clearMap",
    description:
      "Removes crater marks and placed objects, and clears mission selection, filters, and labels. Leaves the time slider alone.",
    inputSchema: z.strictObject({}),
    execute: async () => {
      app.clear();
      return json({ cleared: true });
    },
  });

  return { placeObject: placeObjectTool, clearMap };
}
