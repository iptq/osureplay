osu! Replay Recorder
====================

[![Join the chat at https://gitter.im/osureplay/Lobby](https://badges.gitter.im/osureplay/Lobby.svg)](https://gitter.im/osureplay/Lobby?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge)

Pass in a .osr replay, .osz map, and a filename for the .mpg video, and ideally it'd crank out a video. Still heavily under development, so nothing works. I have basically no background in graphics or video rendering, much less with complicated libraries like OpenGL and FFmpeg, so this is a learning project for me.

If you're looking for a (kind of) working copy, look in the `js-version` branch. That contains the version I wrote in Node.js before I started working on the C port. It can correctly render circles and sliders using @ko-tori's editor¡nso lib, and output a pretty simplified video.

For this version, I'm planning to go all out with lots of customizations such as video size, customizing skin, etc. If you're familiar with development, by all means contact me using the information at the end of this document.

What is osu?
------------

It's a rhythm game where you click circles to the beat.

Roadmap
-------

- [x] parses .osr files
- [x] parses .osz/.osu files
- [ ] draw elements to screen
  - [ ] draw hit circles
  - [ ] calculate slider shapes
  - [ ] hud
- [ ] draw opengl surface to avframe
- [ ] make it more user friendly
- [ ] skinnable

Contact
=======

Author: Michael Zhang

License: plz no copy

Discord: IOException#6405