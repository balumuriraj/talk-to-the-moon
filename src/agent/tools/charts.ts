import { z } from "zod";
import { FunctionTool } from "@arcgis/ai-components/agent-utils/tools/FunctionTool.js";
import {
  PRESETS,
  PRESET_IDS,
  checkCustomChart,
  chartInfo,
  customChartSchema,
  describeChartFields,
  type ChartRequest,
} from "../../cards/charts";
import type { MoonApp } from "../../map/controller";
import { json, showCard } from "./shared";

/** showChart: a preset or custom chart card. The chart itself is built in cards/charts.ts. */

export function createChartTools(app: MoonApp) {
  const chartSchema = z
    .strictObject({
      preset: z.enum(PRESET_IDS).optional(),
      custom: customChartSchema.optional(),
    })
    .refine(
      // Exactly one of the two.
      (input) => !input.preset !== !input.custom,
      "Give either a preset or a custom chart.",
    );

  const presetList = PRESET_IDS.map(
    (id) => `- ${id}: ${PRESETS[id].about}`,
  ).join("\n");

  const showChart = new FunctionTool({
    name: "showChart",
    description: [
      "Shows a native chart card without changing the map. Returns display confirmation and caveats, not numbers: use queryData for facts and never estimate values from a chart. Presets:",
      presetList,
      "Or a custom chart: a type, an x field, an aggregation, an optional value field, and an SQL where on these fields (the mission fields match queryData's names and values; date fields are counted per year; use arrivalDecade or launchDecade for decades):",
      describeChartFields(app.charts),
    ].join("\n"),
    inputSchema: chartSchema,
    execute: async ({ preset, custom }, config) => {
      let request: ChartRequest;
      if (custom) {
        const chart = customChartSchema.parse(custom);
        const error = checkCustomChart(app.charts, chart);
        if (error) throw new Error(error);
        // Check the where clause before showing the card.
        await app.charts[chart.table].queryFeatureCount({ where: chart.where });
        request = { custom: chart };
      } else {
        request = { preset: preset! };
      }
      const { title, note } = chartInfo(request);
      await showCard("chart", request, config);
      return json({ shownToUser: `chart card: ${title}`, caveats: note });
    },
  });

  return { showChart };
}
