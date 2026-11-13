# Build your own agentic map

You don't need the Moon to use this pattern. You need a map, an assistant, and
tools that turn what people say into actions on your data.

## Who does what

| Part | Job |
| --- | --- |
| Next.js and React | Render the page and own the layout |
| `arcgis-scene` | Show a 3D map and expose its view |
| `arcgis-assistant` | Sign-in, the conversation, and calling the agent |
| `SkillAgent` | Pick a skill, then tools, from their descriptions |
| Your tools | Check input, query data, call map actions, return facts |
| Your cards | Show a tool's results in the chat, with buttons |

The agent can do nothing in the browser except call the tools registered in
[agent.ts](../src/agent/agent.ts).

## Follow "Take me to Apollo 11" through the code

### 1. The page starts the app

[App.tsx](../src/App.tsx) declares both scenes, the slider, and the assistant in
JSX. It creates the maps once with `createMoonScene()` and `createEarthScene()`
and passes them to the scenes.

An effect then calls [createMoonApp](../src/map/controller.ts). It waits for
both views, reads the mission and launch-site records, and returns `app`: the
object with every map action. Once `app` exists, React renders the agent and
the chat cards.

### 2. The agent chooses a tool

[createMoonAgent](../src/agent/agent.ts) registers three skills from
[skills.ts](../src/agent/skills.ts) and the tools from
[tools.ts](../src/agent/tools.ts). A skill is Markdown: guidance plus an
`allowed-tools` list. The `explore` skill covers finding and visiting things.

Before each turn, `runtimeContextLoader` tells the model what the map shows:
which world, the slider's dates, the selection, and what is drawn. That is how
a follow-up like "tell me more about it" works.

### 3. Queries find ids, actions take them

The model calls `queryData` with SQL on the missions layer, asking for `id` and
`name` where `name = 'Apollo 11'`. Then it calls `goTo` with
`{ target: { kind: "mission", id: "apollo-11" } }`.

Targets are typed: a mission id, an exact crater name, a place id, a
launch-site id, or the Moon or Earth. `goTo` does not guess. An unknown id
throws an error that the model can read and recover from.

When a request is unclear ("Take me to Chang'e"), the model calls
`chooseMission`, which asks the user to pick.

### 4. The map acts

`goTo` calls `app.visit(mission)`, which:

1. stops anything in progress and travels to the Moon if needed,
2. selects the mission, with a highlight and a label,
3. flies there with `view.goTo()`,
4. stands the lunar module at the site ([siteModel.ts](../src/extras/siteModel.ts)).

Card buttons call the same `app.visit`, so a click and a chat request behave
the same way.

### 5. The tool returns two things

For the user, `showCard("mission-card", { id }, config)` sends card data
through the SDK. [Cards.tsx](../src/cards/Cards.tsx) renders the matching React
card in the chat. Cards look up records by id, so the data sent stays small.

For the model, the tool returns JSON facts: dates, launch site, and days to the
surface. The model writes its reply from those.

The camera move runs in the background, so the reply appears while the camera
is still flying.

## Add a tool

Start with something small and read-only, for example counting the missions
shown at the slider's current date. In `createTools` in
[tools.ts](../src/agent/tools.ts):

```ts
const countVisibleMissions = new FunctionTool({
  name: "countVisibleMissions",
  description: "Counts the missions shown at the time slider's current date. Doesn't change the map.",
  inputSchema: z.strictObject({}),
  execute: async () => {
    const end = app.slider.timeExtent?.end?.getTime() ?? Infinity;
    const visible = data.missions.filter((m) => m.arrivalDate <= end);
    return json({ count: visible.length, through: app.slider.timeExtent?.end });
  },
});
```

Then:

1. Add it to the array that `createTools` returns.
2. Add `countVisibleMissions` to `allowed-tools` in the `history` skill in
   [skills.ts](../src/agent/skills.ts), with a line saying when to use it.
3. Ask the assistant: "How many missions are on the map right now?"

Add a card only if it helps the user. Many tools need only a return value.

## Start smaller

For a new app, begin with:

1. A client-only React component with one `arcgis-map` or `arcgis-scene` and
   one `arcgis-assistant`.
2. The portal set before the components load ([config.ts](../src/config.ts)),
   and the CSS imports from [styles.css](../src/styles.css).
3. One FeatureLayer and one map action, such as `goToFeature`.
4. One `FunctionTool` with a narrow schema and a clear description.
5. A `SkillAgent` with one skill that allows the tool.

[scale.ts](../src/map/scale.ts) exists only because the lunar services draw the
Moon on an Earth-sized globe. An Earth map does not need it.
