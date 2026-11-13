import { z } from "zod";
import { FunctionTool } from "@arcgis/ai-components/agent-utils/tools/FunctionTool.js";
import {
  createHumanInTheLoopToolMiddleware,
  getHumanInTheLoopPayload,
} from "@arcgis/ai-components/agent-utils/middlewares/humanInTheLoop.js";
import {
  findMission,
  isFarSide,
  isLanding,
  yearOf,
  type Mission,
} from "../../data";
import type { MoonApp } from "../../map/controller";
import { inBackground, json, showCard } from "./shared";

/** showMissions, chooseMission, and setTime: which missions the map shows, and when. */

/** The first year anything reached the Moon (Luna 2). */
const FIRST_YEAR = 1959;

export function createMissionTools(app: MoonApp) {
  const { data, moon } = app;

  const showMissions = new FunctionTool({
    name: "showMissions",
    description:
      "Shows a set of missions in a list card and on the map, hiding the rest; labels up to six. Choose them with an SQL where on the mission fields (listed by arrival date), or with explicit missionIds in the order to show. Give neither to restore every mission marker and frame the whole Moon. An empty missionIds list hides all markers. Returns the missions shown, so no separate query is needed.",
    inputSchema: z.strictObject({
      where: z
        .string()
        .min(1)
        .optional()
        .describe(
          "ArcGIS SQL on the mission fields, e.g. outcome IN ('crewed', 'soft')",
        ),
      missionIds: z
        .array(z.string())
        .optional()
        .describe(
          "Explicit ids, when the selection or order comes from earlier steps",
        ),
      title: z.string().optional().describe("Card heading"),
    }),
    execute: async ({ where, missionIds, title }, config) => {
      if (where && missionIds)
        throw new Error("Give either where or missionIds, not both.");
      if (where) {
        const { features } = await moon.missions.queryFeatures({
          where,
          outFields: ["id"],
          orderByFields: ["arrivalDate"],
          returnGeometry: false,
        });
        missionIds = features.map((f) => f.attributes.id as string);
      }
      await app.prepare();
      app.showAllTime();

      // Neither given: restore every mission and show the whole Moon.
      if (!missionIds) {
        app.clear();
        app.state.focus = undefined;
        inBackground(
          app.frame(data.missions.filter((m) => !isFarSide(m))),
          "frame the missions",
        );
        return json({
          shownToUser: "whole-Moon view with every mission marker",
          missionsShown: data.missions.length,
          note: "Far-side missions are hidden behind the globe in this view.",
        });
      }

      const missions = [...new Set(missionIds)].map((id) =>
        findMission(data, id),
      );
      const ids = missions.map((m) => m.id);
      app.select(ids, { only: true });
      await showCard(
        "mission-list",
        { title: title ?? "Missions", ids },
        config,
      );
      if (missions.length)
        inBackground(app.frame(missions), "frame the missions");
      return json({
        shownToUser: "list card; the map shows only these missions",
        count: missions.length,
        missions: missions.map((m) => ({
          id: m.id,
          name: m.name,
          country: m.country,
          outcome: m.outcome,
          year: yearOf(m),
        })),
      });
    },
  });

  type Choice = { missionIds: string[]; question: string };
  const choiceLabel = (m: Mission) => `${m.name} (${yearOf(m)})`;
  const chooseMission = new FunctionTool<Choice>({
    name: "chooseMission",
    description:
      "Asks the user to choose among mission ids from queryData and returns the chosen id. Use when the intended mission is ambiguous; it doesn't find candidates.",
    inputSchema: z.strictObject({
      missionIds: z.array(z.string()).min(2),
      question: z.string().min(1),
    }),
    middlewares: [
      // The SDK pauses the run and shows a native single-choice prompt in the chat.
      createHumanInTheLoopToolMiddleware<Choice>({
        id: "choose-mission",
        interrupt: async ({ input }) => ({
          kind: "singleSelection",
          message: input.question,
          metadata: input.missionIds.map((id) =>
            choiceLabel(findMission(data, id)),
          ),
        }),
      }),
    ],
    // Runs after the user answers. The answer is the mission's id or its label.
    execute: async ({ missionIds }, config) => {
      const answer = getHumanInTheLoopPayload<unknown>(config);
      const chosen = missionIds
        .map((id) => findMission(data, id))
        .find((m) => m.id === answer || choiceLabel(m) === answer);
      if (!chosen) throw new Error("Choose one of the offered missions.");
      return json({ missionId: chosen.id });
    },
  });

  const setTime = new FunctionTool({
    name: "setTime",
    description:
      "Stops time-slider playback. With a year, shows the Moon as it was at the end of that year and returns how many missions had arrived by then.",
    inputSchema: z.strictObject({
      year: z
        .number()
        .int()
        .min(FIRST_YEAR)
        .max(new Date().getUTCFullYear())
        .optional(),
    }),
    execute: async ({ year }) => {
      await app.prepare();
      if (year === undefined)
        return json({
          paused: true,
          showingThrough: app.slider.timeExtent?.end?.toISOString(),
        });
      app.showYear(year);
      const soFar = data.missions.filter((m) => yearOf(m) <= year);
      return json({
        showingThrough: year,
        missionsSoFar: soFar.length,
        landingsSoFar: soFar.filter(isLanding).length,
      });
    },
  });

  return { showMissions, chooseMission, setTime };
}
