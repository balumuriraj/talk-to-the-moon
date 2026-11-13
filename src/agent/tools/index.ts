import type { MoonApp } from "../../map/controller";
import { createChartTools } from "./charts";
import { createCraterTools } from "./craters";
import { createMissionTools } from "./missions";
import { createNavigationTools } from "./navigate";
import { createObjectTools } from "./objects";
import { createQueryTools } from "./query";
import { returnErrors } from "./shared";

/**
 * Every tool the guide can call. Each one follows the same shape: validate the input, look up
 * real data, act on the map through `app`, send a card to the chat, and return facts for the
 * model to explain.
 *
 * | File        | Tools                                         |
 * | ----------- | --------------------------------------------- |
 * | query.ts    | queryData                                     |
 * | navigate.ts | goTo, flyLander                               |
 * | missions.ts | showMissions, chooseMission, setTime          |
 * | craters.ts  | showCraters, nearestCraters, showCraterNames  |
 * | charts.ts   | showChart                                     |
 * | objects.ts  | placeObject, clearMap                         |
 *
 * To add a tool: create it in the file it belongs to, return it from that file's function, and
 * add it to the list below. Then allow it in a skill (skills.ts).
 */
export function createTools(app: MoonApp) {
  const { queryData } = createQueryTools(app);
  const { goTo, flyLander } = createNavigationTools(app);
  const { showMissions, chooseMission, setTime } = createMissionTools(app);
  const { showCraters, nearestCraters, showCraterNames } =
    createCraterTools(app);
  const { showChart } = createChartTools(app);
  const { placeObject, clearMap } = createObjectTools(app);

  return [
    returnErrors(queryData),
    returnErrors(goTo),
    returnErrors(showMissions),
    returnErrors(chooseMission),
    returnErrors(showCraters),
    returnErrors(nearestCraters),
    returnErrors(showCraterNames),
    returnErrors(setTime),
    returnErrors(showChart),
    returnErrors(placeObject),
    returnErrors(clearMap),
    returnErrors(flyLander),
  ];
}
