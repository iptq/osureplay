osu! Replay Recorder
====================

Pass in a .osr replay, .osz map, and a filename for the .mpg video, and ideally it'd crank out a video. Still heavily under development, so nothing works. It can correctly render circles and sliders using @ko-tori's editor¡nso lib, and output a pretty simplified video.

Eventually, I'm planning to go all out with lots of customizations such as video size, customizing skin, etc. If you're familiar with development, by all means contact me using the information at the end of this document. The potential use cases would be an automatic replay recording system.

What is osu?
------------

It's a rhythm game where you click circles to the beat.

Roadmap
-------

- [x] parses .osr files
- [x] parses .osz/.osu files
- [x] draw elements to screen
  - [x] draw hit circles
  - [ ] calculate bezier slider shapes
    - [ ] sliders a bit more transparent
    - [ ] slider ticks and ball
  - [ ] follow points
  - [ ] hud
    - [ ] health bar
    - [ ] colorhaxing
- [ ] calculate score
  - [ ] copy scoring algorithm over for circles
  - [ ] scoring algorithm for sliders
- [ ] customizable and configurable
  - [ ] skinnable
- [ ] other game modes?

Contact
=======

Author: Michael Zhang

License: plz no copy

Discord: IOException#6405
