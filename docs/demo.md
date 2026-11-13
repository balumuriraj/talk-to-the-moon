# Demo script

About three minutes. The app opens on a slowly spinning Earth with the launch
sites. Everything after that happens by talking to the guide.

## Before you start

- Sign in through the assistant and send one prompt ("Go to the Moon") to warm
  up the service and the map cache. Then reload so the demo opens on Earth.
- Use a wide window. The map and the chat panel both need room.
- Turn off "reduce motion" in the OS, or the trips between worlds skip their
  animation.

The guide offers each prompt below as a chip above the chat box, one at a time,
so you can click through the whole demo. If you type something else, the next
chip waits. The chips come from [src/tour.ts](../src/tour.ts); change the
prompts there and here together.

## The script

Prompts to send are in *italics*. [Brackets] describe what happens on screen.

"Here is a map of lunar mission launch sites, with an AI guide.

Let's ask it something. *'How many missions have been launched from each country?'*

[A table appears: USA 21, USSR 14, China 5, Japan 5, India 3, and Europe,
Israel, and Russia 1 each.]

*'Where did the Apollo missions launch from?'*

[The answer is Cape Canaveral. The guide may add that Israel's Beresheet and
Japan's Hakuto-R missions launched from there too.]

So far this is a normal chat over data. You ask, you get an answer.

*'Where did those missions land?'*

[Stop talking. Let the camera leave Earth and arrive at the Moon. The map shows
only the 23 Cape Canaveral missions, with a list.]

Those are the Cape Canaveral missions. Now everyone, over time.
*'Show all missions by year.'*

[A bar chart of missions per year.]

A burst of landings, then nothing for decades. Nothing landed between Luna 24
in 1976 and Chang'e 3 in 2013.

Let's visit one. *'Go to an Apollo mission.'*

[There were six Apollo landings, so the guide asks which one. Pick Apollo 11.
The camera flies to a close-up with a lunar module on the surface, then orbits
slowly.]

It asked instead of guessing. *'Show the nearest crater.'*

[Collins crater is marked, 20 km from the landing site.]

It is named for Michael Collins, who stayed in orbit while Armstrong and Aldrin
walked on the Moon. How big is it?
*'Place the tallest building on Earth inside it.'*

[The guide works out that "it" is Collins crater and that the building is the
Burj Khalifa, 828 m. The tower appears at true scale, with a comparison card.]

Collins crater is about two and a half kilometers across. You could lay three
Burj Khalifas end to end inside it.

None of those answers were scripted. The guide has a few skills and tools over
real NASA and IAU data, and it decides the steps itself. The same pattern works
on any data, not just the Moon."

## Facts behind the lines

All from the app's data, so the guide's answers will match what you say.

| Line | Figure |
| --- | --- |
| Missions by country | USA 21, USSR 14, China 5, Japan 5, India 3, Europe (ESA) 1, Israel 1, Russia 1 (51 total) |
| Cape Canaveral | 23 missions, including Beresheet (Israel) and Hakuto-R Missions 1 and 2 (Japan) |
| The quiet years | Luna 24 (August 1976) to Chang'e 3 (December 2013) |
| Apollo landings | Six: Apollo 11, 12, 14, 15, 16, and 17 |
| Nearest crater to Apollo 11 | Collins, 20 km away. Aldrin (47 km) and Armstrong (49 km) are also close |
| Collins crater | 2.6 km across. The Burj Khalifa is 828 m tall, so the crater is about 3 times wider |

Don't compare the tower with the crater's depth. Depths aren't in the data, and
the guide won't confirm it.

## Spare prompts

Use these if you have time, or if a step above doesn't work:

- "What's named after the Apollo 11 crew?" marks Collins, Aldrin, and Armstrong
  around the site.
- "Take me to Chang'e" makes the guide ask which one.
- "Show the Moon as it was in 1969" moves the time slider to the end of 1969.
- "Now put Mount Everest in Tycho", or "How big is a Saturn V next to Apollo 11?"
- "Compare average crater size on the near and far sides" (about 46 km and 73 km).

## Easter egg

To finish: *"Let me fly the lander."* A lunar module appears with a camera
behind it. Left and right arrows steer, up and down climb and descend, and Esc
lands.

## If something goes wrong

- **The guide asks a question:** answer it. It is meant to ask instead of guess.
- **The map is cluttered:** "Clear the map", or "Show everything" to bring back
  every mission.
- **The camera is somewhere odd:** "Go to the Moon" or "Show everything" resets
  the view.
- **A step fails or hangs:** move on. Each prompt stands on its own. Reloading
  takes you back to Earth.
