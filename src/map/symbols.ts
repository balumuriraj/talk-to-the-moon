import LineCallout3D from "@arcgis/core/symbols/callouts/LineCallout3D.js";

/** The thin line from a floating icon down to its exact spot on the ground. */
export const leaderLine = () =>
  new LineCallout3D({
    size: 1,
    color: [255, 255, 255, 0.75],
    border: { color: [6, 8, 14, 0.6] },
  });
