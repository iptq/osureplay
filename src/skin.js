const path = require("path");

const Canvas = require("canvas"), Image = Canvas.Image;

const constants = require("./constants");
const utils = require("./utils");

const names = [
  "approachcircle",
  "cursor",
  "cursortrail",
  "default-0",
  "default-1",
  "default-2",
  "default-3",
  "default-4",
  "default-5",
  "default-6",
  "default-7",
  "default-8",
  "default-9",
  "hitcircle",
  "hitcircleoverlay",
  "reversearrow",
  "sliderb0",
  "hit0",
  "hit50",
  "hit100",
  "hit300",
  "scorebar-bg",
  "sliderfollowcircle",
];

class Skin {
  constructor() {
    this.resources = {};
    this.options = {};
  }
  async load() {
    // loads all images asynchronously
    for (let i = 0; i < names.length; ++i) {
      // read images one by one
      this.resources[names[i]] = new Image();
      this.resources[names[i]].src = await utils.readFileAsync(
          path.join(constants.SKIN_DIR, names[i] + ".png"));
      process.stdout.write("\rLoading images... (" +
                           Math.round((i + 1) * 10000.0 / names.length) / 100 +
                           "%)  ");
    }
    console.log();
    console.log("Skin has been loaded.");
  }
  get(name, options) {
    let image = this.resources[name];
    if (options) {
      if (options.tint)
        image = utils.tint(`skin:${name}`, image, options.tint);
    }
    return image;
  }
  addImage(name, image) {
    // adds an image obj to the dict
    this.resources[name] = image;
  }
  async parseIni(skinname) {
    let content =
        await utils.readFileAsync(path.join(constants.SKIN_DIR, "skin.ini"));
    var skin = {};
    var keyValReg = /^([a-zA-Z0-9]+)[ ]*:[ ]*(.+)$/;
    content.toString().split(/[\n\r]+/).forEach(function(line) {
      line = line.toString().trim();
      if (!line) {
        return;
      }
      var match = keyValReg.exec(line);
      if (match) {
        skin[match[1]] = match[2];
      }
    });

    console.log("Skin's .ini parsed.");
    return skin;
  }
}

module.exports = Skin;