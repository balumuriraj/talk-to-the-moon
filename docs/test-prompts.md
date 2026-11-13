# Test prompts

A manual test for a signed-in assistant. Together these prompts use all 12
tools, every card type, and the three skills. Run them in order in one session,
because some build on what is already on the map.

## Check throughout

- Every card comes with reply text. A card with no text means the chat slots
  are broken.
- Lookups don't show a table. Tables appear only when the numbers are the answer.
- Charts render in color, not black.
- A bad step comes back as a correction from the guide, never as "I couldn't
  complete this request."
- The browser console shows no errors.
- The guide never states a number that a tool didn't return.

## 1. Travel and Earth

| # | Prompt | Expect |
| --- | --- | --- |
| 1 | Show me where Apollo 11 launched from | Earth turns to Cape Canaveral |
| 2 | Where did the Chinese missions launch from? | An answer from the data; may turn to Xichang or Wenchang |
| 3 | Go to the Moon | Pull back, crossfade, fly in. The reply mentions 51 missions and 28 landings |
| 4 | Take me back to Earth | The trip back; the globe spins again |
| 5 | Go to the Moon | Back on the Moon for the rest of the test |

## 2. Missions

| # | Prompt | Expect |
| --- | --- | --- |
| 6 | Take me to Apollo 11 | Mission card with a details table, close-up, lunar module at the site, highlight and label. No query table |
| 7 | Take me to Chang'e | The guide asks which one; pick one and it flies there |
| 8 | Show me every place we've landed on the Moon | One list card of 28 landings and a filtered map. No table first |
| 9 | Show only USA landings | 14 missions on the map and in the list |
| 10 | Show everything | Every marker returns |
| 11 | Show the three Apollo missions that carried rovers | Apollo 15, 16, and 17, labeled |
| 12 | Click a mission in that list | The camera flies to it |
| 13 | Tell me more about it | "It" is the last place the camera went |
| 14 | Take me to Luna 9 | The card says the location is approximate |

## 3. Craters and places

| # | Prompt | Expect |
| --- | --- | --- |
| 15 | Take me to Tycho | Rim drawn, crater card with the origin of its name |
| 16 | Show Copernicus, Kepler and Aristarchus | List card, three rims, all in view |
| 17 | What are the nearest craters to Apollo 11? | Collins, Moltke, Aldrin, Armstrong and others, with distances in km |
| 18 | Nearest craters to Tycho bigger than 50 km | Filtered results; Tycho itself left out |
| 19 | Biggest craters on the far side | Ranked from a query, likely shown on the map |
| 20 | Take me to Shackleton | Works near the south pole |
| 21 | What's named after the Apollo 11 crew? | Collins, Aldrin, and Armstrong, marked on the map |
| 22 | Show all crater names, then hide them | Crater labels turn on, then off |
| 23 | Take me to the south pole | Close-up of the pole |
| 24 | Clear the map | Rims, objects, and selection gone; slider unchanged |

## 4. History and time

| # | Prompt | Expect |
| --- | --- | --- |
| 25 | Show the Moon as it was in 1969 | Slider at the end of 1969; 17 missions so far, 9 landings |
| 26 | Press play on the slider, then say "pause" | Playback stops |
| 27 | Why did it go quiet? | The gap from Luna 24 (1976) to Chang'e 3 (2013), from queried dates |
| 28 | What was the first landing that wasn't by a government? | A commercial landing, from a query ordered by date |
| 29 | How many missions did each country send? | A table card |
| 30 | When did India first reach the Moon? | The earliest arrival date |
| 31 | Which missions shared a rocket? | An answer from the `rideshare` field |
| 32 | How long did Apollo 11 take to get there? | 4 days |

## 5. Charts

| # | Prompt | Expect |
| --- | --- | --- |
| 33 | Chart successful landings per year | Preset chart; the 37-year gap is visible |
| 34 | How did each country's missions end? Show a chart | Stacked bars; the legend reads "Crewed landing", "Robotic landing", and so on |
| 35 | Show a histogram of crater sizes | Preset histogram with colored bars |
| 36 | Chart missions by spaceport | Bars labeled with spaceport names |
| 37 | Plot trip times against launch year | Scatter chart without planned impacts; a caveat in the card |
| 38 | Pie chart of near side vs far side craters | About 57% near and 43% far |
| 39 | Missions per decade as a line chart | A line over the decades in order |
| 40 | Compare average crater size on the near and far sides | About 46 km and 73 km |

## 6. True-scale objects

| # | Prompt | Expect |
| --- | --- | --- |
| 41 | Stand the Burj Khalifa in Tycho crater | A tower on the crater floor; the crater is about 103 times wider than the tower is tall |
| 42 | Now put Mount Everest in Tycho | A cone replaces the tower |
| 43 | Put the Eiffel Tower next to Apollo 11 | A tower beside the landing site |
| 44 | How big is a Saturn V next to Apollo 11? | A cylinder, about 110 m, framed close |
| 45 | Put a football stadium in Copernicus | A block, with the size figures the guide used |
| 46 | Put the Las Vegas Sphere next to Apollo 12 | A sphere, about 112 m |
| 47 | Put my house in Tycho | Asks for the size, or says it can't know it |
| 48 | Click **Remove it** on the card | The map clears |

## 7. Easter egg

| # | Prompt | Expect |
| --- | --- | --- |
| 49 | Let me fly the lander | A lunar module appears with a camera behind it. Left and right steer, up and down climb and descend |
| 50 | Press Esc, or ask for anything else | The flight ends |

## 8. Errors and limits

| # | Prompt | Expect |
| --- | --- | --- |
| 51 | Take me to Apollo 99 | Says there's no such mission and offers real ones |
| 52 | Chart missions by crew size | Explains there's no such field; may offer another chart |
| 53 | Take me to Mare Tranquillitatis | Explains that only craters are included; offers Apollo 11 |
| 54 | Which craters are named after astronauts? | Declines the broad search; named people are fine |
| 55 | How deep is Tycho? | Depths aren't available; offers the diameter |
| 56 | How far is Apollo 11 from Apollo 12? | Point-to-point measurement isn't supported |
| 57 | What's the weather in Paris? | Stays on the subject of the Moon |
