import { z } from "zod";
import { FunctionTool } from "@arcgis/ai-components/agent-utils/tools/FunctionTool.js";
import type { MoonApp } from "../../map/controller";
import { json, sentences, showCard } from "./shared";

/** queryData: read-only SQL on the hosted layers. Every fact the guide states starts here. */

/** A plain field name, so nothing but a field can be passed where one is expected. */
const identifier = z.string().regex(/^[A-Za-z_]\w*$/);

const DEFAULT_LIMIT = 100;
const MAX_LIMIT = 1000;

const querySchema = z.strictObject({
  dataset: z.enum(["missions", "craters"]),
  showTable: z
    .boolean()
    .default(false)
    .describe(
      "Show the rows as a table card. Only when the table is the answer the user wants (counts, statistics, rankings, comparisons); leave false when looking up ids or names for another tool, whose own card shows the result.",
    ),
  title: z.string().min(1).optional().describe("Heading for the table card"),
  where: z.string().min(1).default("1=1"),
  outFields: z.array(identifier).default([]),
  outStatistics: z
    .array(
      z.strictObject({
        statisticType: z.enum(["count", "sum", "min", "max", "avg"]),
        onStatisticField: identifier,
        outStatisticFieldName: identifier,
      }),
    )
    .default([]),
  groupByFieldsForStatistics: z.array(identifier).default([]),
  orderByFields: z
    .array(z.string().regex(/^[A-Za-z_]\w*( (ASC|DESC))?$/))
    .default([]),
  limit: z.number().int().min(1).max(MAX_LIMIT).default(DEFAULT_LIMIT),
});

export function createQueryTools(app: MoonApp) {
  const { data, moon } = app;
  const fieldList = (layer: typeof moon.missions) =>
    layer.fields.map((f) => `${f.name} (${f.type})`).join(", ");
  // Exact text values, so the model doesn't guess ('near' instead of 'Near side') and get no rows.
  const valuesOf = (field: "country" | "operator" | "launchSiteId") =>
    [...new Set(data.missions.map((m) => m[field]).filter(Boolean))]
      .sort()
      .map((v) => `'${v}'`)
      .join(", ");

  const queryData = new FunctionTool({
    name: "queryData",
    description: sentences(
      "Read-only ArcGIS queries on the hosted missions or craters layer, independent of the camera, time slider, and map selection.",
      "Give a SQL WHERE clause (not a SELECT statement) and either outFields or outStatistics with optional groupByFieldsForStatistics; orderByFields sorts.",
      `Missions: ${fieldList(moon.missions)}.`,
      `Craters: ${fieldList(moon.craters)}.`,
      "Include the mission id or crater name when a later action needs them.",
      "Dates are UTC; WHERE supports TIMESTAMP 'YYYY-MM-DD HH:MM:SS'.",
      "Mission flags are 0/1; missing text is null or empty.",
      "Outcomes: crewed, soft (robotic landing), crash, impact (planned impact); successful landings are crewed or soft.",
      `Exact text values: mission country ${valuesOf("country")}; operator ${valuesOf("operator")}; launchSiteId ${valuesOf("launchSiteId")}; crater side 'Near side' or 'Far side'.`,
      `Statistics are count, sum, min, max, avg on field names, not expressions; count the ${moon.missions.objectIdField} field for record counts, and sort aggregates by their output names.`,
      `Default limit ${DEFAULT_LIMIT}, at most ${MAX_LIMIT}; truncated means more rows exist.`,
      "Returns the rows to you either way; doesn't change the map.",
    ),
    inputSchema: querySchema,
    execute: async (input, config) => {
      const q = querySchema.parse(input);
      const layer = q.dataset === "missions" ? moon.missions : moon.craters;
      const statistics = q.outStatistics.length > 0;
      const columns = statistics
        ? [
            ...q.groupByFieldsForStatistics,
            ...q.outStatistics.map((s) => s.outStatisticFieldName),
          ]
        : q.outFields;
      if (!columns.length)
        throw new Error("Choose outFields, or outStatistics.");
      const result = await layer.queryFeatures({
        where: q.where,
        returnGeometry: false,
        orderByFields: q.orderByFields,
        ...(statistics
          ? {
              outStatistics: q.outStatistics,
              groupByFieldsForStatistics: q.groupByFieldsForStatistics,
            }
          : {
              outFields: q.outFields,
              // One extra row tells us whether there are more than the limit.
              num: q.limit + 1,
              maxRecordCountFactor: 2,
            }),
      });
      // Report dates as ISO strings, including the min/max of a date field.
      const dates = new Set(
        layer.fields.filter((f) => f.type === "date").map((f) => f.name),
      );
      for (const s of q.outStatistics) {
        if (
          (s.statisticType === "min" || s.statisticType === "max") &&
          dates.has(s.onStatisticField)
        )
          dates.add(s.outStatisticFieldName);
      }
      const rows = result.features.slice(0, q.limit).map((f) =>
        Object.fromEntries(
          columns.map((column) => {
            const value = (f.attributes[column] ?? null) as
              | string
              | number
              | null;
            return [
              column,
              dates.has(column) && typeof value === "number"
                ? new Date(value).toISOString()
                : value,
            ];
          }),
        ),
      );
      const results = {
        columns,
        rows,
        truncated: result.features.length > q.limit,
      };
      // An empty table says nothing the reply can't.
      const shown = q.showTable && rows.length > 0;
      if (shown)
        await showCard(
          "query-results",
          { title: q.title ?? "Query results", ...results },
          config,
        );
      return json({
        dataset: q.dataset,
        shownToUser: shown ? "table card" : "nothing",
        ...results,
      });
    },
  });

  return { queryData };
}
