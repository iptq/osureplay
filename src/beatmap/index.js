const fs = require("fs");

const Color = require("../color");
const HitObject = require("./hitObject"), Slider = HitObject.Slider;
const TimingPoint = require("./timingPoint");
const utils = require("../utils");

const sectionPattern = /^\[([a-zA-Z0-9]+)\]$/,
      keyPairPattern = /^([a-zA-Z0-9]+)[ ]*:[ ]*(.+)?$/;

class Beatmap {
  constructor() {}
  async parse(file) {
    if (!fs.existsSync(file)) {
      callback(new Error("File doesn't exist."));
    }

    let data = await utils.readFileAsync(file);
    let result = await this.parseString(data.toString());
    console.log("Beatmap parsed.");
    return result;
  }
  newID() {
    var id;
    while (true) {
      id = Util.randomString();
      if (id in this.HitObjects)
        continue;
      if (id in this.TimingPoints)
        continue;
      break;
    }
    return id;
  }
  async parseString(data) {
    var i, id;
    var beatmap = new Beatmap();
    var lines = data.split(/\r?\n/);
    var osuSection;
    var sections = {};
    beatmap.ComboColors = [];
    beatmap.Bookmarks = [];
    beatmap.Tags = [];
    var parseBookmark = function(bookmark) {
      return parseInt(bookmark); // avoid
      // http://stackoverflow.com/questions/14528397/strange-behavior-for-map-parseint
    };
    for (i = 0; i < lines.length; i += 1) {
      var line = lines[i].trim();
      if (!line)
        continue;
      var match = sectionPattern.exec(line);
      if (match) {
        osuSection = match[1].toLowerCase();
        continue;
      }
      switch (osuSection) {
      case "timingpoints":
        if (!("TimingPoints" in sections))
          sections.TimingPoints = [];
        sections.TimingPoints.push(line);
        break;
      case "hitobjects":
        if (!("HitObjects" in sections))
          sections.HitObjects = [];
        sections.HitObjects.push(line);
        break;
      case "events":
        if (!("Events" in sections))
          sections.Events = [];
        sections.Events.push(line);
        break;
      default:
        if (!osuSection) {
          match = /^osu file format (v[0-9]+)$/.exec(line);
          if (match) {
            beatmap.FileFormat = match[1];
            continue;
          }
        } else {
          match = keyPairPattern.exec(line);
          if (match) {
            if (!match[2])
              match[2] = '';
            if (/combo(\d+)/i.exec(match[1])) {
              beatmap.ComboColors.push(Color.fromArray(match[2].split(",")));
              continue;
            }
            switch (match[1].toLowerCase()) {
            case "tags":
              beatmap[match[1]] = match[2].split(" ");
              break;
            case "bookmarks":
              beatmap[match[1]] = match[2].split(",").map(parseBookmark);
              break;
            case "stackleniency":
            case "distancespacing":
            case "beatdivisor":
            case "gridsize":
            case "previewtime":
            case "mode":
            case "hpdrainrate":
            case "circlesize":
            case "approachrate":
            case "overalldifficulty":
            case "slidermultiplier":
            case "slidertickrate":
              beatmap[match[1]] = parseFloat(match[2]);
              break;
            default:
              beatmap[match[1]] = match[2];
              break;
            }
          }
        }
        break;
      }
    }

    beatmap.TimingPoints = [];
    beatmap.HitObjects = [];

    beatmap.BpmMin = Infinity;
    beatmap.BpmMax = 0;
    var prev = null;
    for (i = 0; i < sections.TimingPoints.length; i += 1) {
      var timingPoint = new TimingPoint(sections.TimingPoints[i]);
      if (timingPoint.bpm) {
        beatmap.BpmMin = Math.min(beatmap.BpmMin, timingPoint.bpm);
        beatmap.BpmMax = Math.max(beatmap.BpmMax, timingPoint.bpm);
        timingPoint.baseOffset = timingPoint.offset;
      } else if (prev) {
        timingPoint.beatLength = prev.beatLength;
        timingPoint.bpm = prev.bpm;
        timingPoint.baseOffset = prev.baseOffset;
      }
      prev = timingPoint;
      beatmap.TimingPoints.push(timingPoint);
    }
    beatmap.TimingPoints.sort(function(a, b) { return a.offset - b.offset; });
    let comboNumber = 0;
    let comboColor = 0;
    beatmap.maxCombo = 0;
    for (i = 0; i < sections.HitObjects.length; i += 1) {
      var hitObject = HitObject.parse(sections.HitObjects[i]);
      hitObject.beatmap = beatmap;
      if (hitObject instanceof Slider) {
        hitObject.calculate();
      }
      if (i === 0 || hitObject.newCombo) {
        comboNumber = 1;
        comboColor = (comboColor + 1 + (hitObject instanceof HitObject.Spinner
                                            ? hitObject.customColor
                                            : 0)) %
                     beatmap.ComboColors.length;
      } else {
        comboNumber += 1;
        if (comboNumber > beatmap.maxCombo)
          beatmap.maxCombo = comboNumber;
      }
      hitObject.comboNumber = comboNumber;
      hitObject.comboColor = beatmap.ComboColors[comboColor];
      beatmap.HitObjects.push(hitObject);
    }
    beatmap.HitObjects.sort(function(a, b) {
      return a.startTime - b.startTime;
    });

    beatmap.breakTimes = [];
    beatmap.originalEvents = sections.Events.join('\n');
    for (i = 0; i < sections.Events.length; i += 1) {
      var members = sections.Events[i].split(',');

      if (members[0] == '0' && members[1] == '0' && members[2]) {
        var bgName = members[2].trim();

        if (bgName.charAt(0) == '"' &&
            bgName.charAt(bgName.length - 1) == '"') {
          beatmap.bgFilename = bgName.substring(1, bgName.length - 1);
        } else {
          beatmap.bgFilename = bgName;
        }
      } else if (members[0] == '2' && /^[0-9]+$/.test(members[1]) &&
                 /^[0-9]+$/.test(members[2])) {
        beatmap.breakTimes.push(
            {startTime : parseInt(members[1]), endTime : parseInt(members[2])});
      }
    }

    // console.log(sections);
    return beatmap;
  }

  getTimingPoint(offset) {
    // perform binary search for the timing section to which this offset belongs
    var left = 0, right = this.TimingPoints.length - 1;
    var result = 0;
    while (left <= right) {
      var midpoint = ~~((left + right) / 2);
      if (this.TimingPoints[midpoint].offset > offset) {
        right = midpoint - 1;
      } else {
        result = midpoint;
        left = midpoint + 1;
      }
    }
    return this.TimingPoints[result];
    // for (var i = this.TimingPoints.length - 1; i >= 0; i -= 1) {
    //  if (this.TimingPoints[i].offset <= offset)
    //      return this.TimingPoints[i];
    // }
    // return this.TimingPoints[0];
  }

  getIndexAt(offset) {
    for (var i = 0; i < this.HitObjects.length; i++) {
      var obj = this.HitObjects[i];
      if (obj instanceof Slider || obj instanceof Spinner) {
        if (offset < obj.endTime) {
          return i;
        }
      } else {
        if (offset <= obj.startTime) {
          return i;
        }
      }
    }
    return i - 1;
  }

  matchObj(id) {
    for (var i = 0; i < this.HitObjects.length; i++) {
      if (this.HitObjects[i].hasOwnProperty('id') &&
          this.HitObjects[i].id == id)
        return this.HitObjects[i];
    }
  }
}

module.exports = Beatmap;