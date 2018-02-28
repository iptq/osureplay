const fs = require("fs");

const Color = require("../color");
const HitObject = require("./hitObject"), HitCircle = HitObject.HitCircle,
  Slider = HitObject.Slider, Spinner = HitObject.Spinner;
const TimingPoint = require("./timingPoint");
const constants = require("../constants");
const utils = require("../utils");

const sectionPattern = /^\[([a-zA-Z0-9]+)\]$/,
  keyPairPattern = /^([a-zA-Z0-9]+)[ ]*:[ ]*(.+)?$/;

class Beatmap {
  constructor() {}
  static async parse(file) {
    if (!fs.existsSync(file)) {
      throw new Error("File doesn't exist.");
    }

    let data = await utils.readFileAsync(file);
    let result = await Beatmap.parseString(data.toString());
    console.log("Beatmap parsed.");
    return result;
  }
  static async parseString(data) {
    var i;
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

    beatmap.Diff = beatmap.AdjDiff = {
      AR : beatmap.ApproachRate,
      CS : beatmap.CircleSize,
      HP : beatmap.HPDrainRate,
      OD : beatmap.OverallDifficulty
    };

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
      hitObject.id = beatmap.newID();
      if (i === 0 || hitObject.newCombo) { // or spinner or break apparently
        comboNumber = 1;
        comboColor = (comboColor + 1 + (hitObject instanceof HitObject.Spinner
          ? hitObject.customColor : 0)) % beatmap.ComboColors.length;
      } else {
        comboNumber += 1;
        if (comboNumber > beatmap.maxCombo)
          beatmap.maxCombo = comboNumber;
      }
      hitObject.comboNumber = comboNumber;
      hitObject.comboColor = beatmap.ComboColors[comboColor].clone();
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

    return beatmap;
  }

  newID() {
    var id;
    while (true) {
      id = utils.randomString();
      if (id in this.HitObjects)
        continue;
      if (id in this.TimingPoints)
        continue;
      break;
    }
    return id;
  }

  adjustForMods(mods) {
    this.mods = mods;
    if (mods.Easy) {
      this.AdjDiff.AR = Math.max(0, this.Diff.AR / 2);
      this.AdjDiff.CS = Math.max(0, this.Diff.CS / 2);
      this.AdjDiff.HP = Math.max(0, this.Diff.HP / 2);
      this.AdjDiff.OD = Math.max(0, this.Diff.OD / 2);
    } else if (mods.HardRock) {
      this.AdjDiff.AR = Math.min(10, this.Diff.AR * 1.4);
      this.AdjDiff.CS = Math.min(10, this.Diff.CS * 1.3);
      this.AdjDiff.HP = Math.min(10, this.Diff.HP * 1.4);
      this.AdjDiff.OD = Math.min(10, this.Diff.OD * 1.4);
      for (let obj of this.HitObjects)
        obj.hrFlip();
    }
    console.log(this.AdjDiff);
  }

  mapDiffRange(diff, min, mid, max) {
    // something that osu uses to (kind of) linearly map a difficulty value to a
    // range, whatever that range may be. the slope gets steeper for higher
    // difficulty value at a cutoff of 5
    if (diff > 5)
      return mid + (max - mid) * (diff - 5) / 5;
    if (diff < 5)
      return mid - (mid - min) * (5 - diff) / 5;
    return mid;
  }

  calculateDifficultyProperties() {
    this.ReactionTime = this.mapDiffRange(this.AdjDiff.AR, 1800, 1200, 450);
    this.Hit300 = this.mapDiffRange(this.AdjDiff.OD, 80, 50, 20);
    this.Hit100 = this.mapDiffRange(this.AdjDiff.OD, 140, 100, 60);
    this.Hit50 = this.mapDiffRange(this.AdjDiff.OD, 200, 150, 100);

    let gameFieldWidth = constants.FULL_WIDTH * 512.0 / 640;
    // this.RealCS = 88 - 8 * (this.AdjDiff.CS - 2); // ?
    this.RealCS = gameFieldWidth / 8 * (1 - 0.7 * (this.AdjDiff.CS - 5) / 5);
    for (let obj of this.HitObjects) {
      obj.radius = this.RealCS;
      if (obj instanceof Slider)
        obj.calculate();
    }
  }

  updateStacking(start = 0, end = -1) {
    // basically a direct port of the stacking algorithm

    const STACK_LENIENCE = 3; // in osupx i assume
    let nObj = this.HitObjects.length;
    while (end < 0)
      end += nObj;
    let stackThreshold = this.ReactionTime * this.StackLeniency;
    // console.log("stack leniency:", stackLeniency);

    // reset stacking first
    for (let i = end; i >= start; --i)
      this.HitObjects[i].stackHeight = 0;

    // just extend the end index in case it's not the base
    let extEnd = end;
    for (let i = end; i >= start; --i) {
      let stackBase = i;
      for (let n = stackBase + 1; n < nObj; ++n) {
        // bottom of the stack
        let stackBaseObj = this.HitObjects[stackBase];
        if (stackBaseObj instanceof Spinner)
          break;

        // current object
        let objN = this.HitObjects[n];
        if (objN instanceof Spinner)
          continue;

        // check if out of range
        if (objN.startTime - stackBaseObj.endTime > stackThreshold)
          break;

        if (stackBaseObj.position.distanceTo(objN.position) < STACK_LENIENCE ||
            (stackBaseObj instanceof Slider &&
             stackBaseObj.endPosition.distanceTo(objN.position) <
                 STACK_LENIENCE)) {
          stackBase = n;
          this.HitObjects[n].stackHeight = 0;
        }
      }
      if (stackBase > extEnd) {
        extEnd = stackBase;
        if (extEnd == nObj - 1)
          break;
      }
    }

    // actually build the stacks now :D
    let extStart = start;
    for (let i = extEnd; i > start; --i) {
      let n = i;
      if (this.HitObjects[i].stackHeight != 0 ||
          this.HitObjects[i] instanceof Spinner)
        continue;

      let j = i;
      if (this.HitObjects[i] instanceof HitCircle) {
        while (--n >= 0) {
          let objN = this.HitObjects[n];
          if (objN instanceof Spinner)
            continue;
          if (this.HitObjects[j].startTime - objN.endTime > stackThreshold)
            break;
          if (n < extStart) {
            this.HitObjects[n].stackHeight = 0;
            extStart = n;
          }
          if (objN instanceof Slider &&
              objN.endPosition.distanceTo(this.HitObjects[j].position) <
                  STACK_LENIENCE) {
            let offset = this.HitObjects[j].stackHeight - objN.stackHeight + 1;
            for (let j = n + 1; j <= i; ++j) {
              let objJ = this.HitObjects[j];
              if (objN.endPosition.distanceTo(objJ.position) < STACK_LENIENCE)
                objJ.stackHeight -= offset;
            }
            break;
          }
          if (objN.position.distanceTo(this.HitObjects[j].position) <
              STACK_LENIENCE) {
            this.HitObjects[n].stackHeight = this.HitObjects[j].stackHeight + 1;
            // console.log("new stack height =", objN.stackHeight);
            j = n;
          }
        }
      } else if (this.HitObjects[i] instanceof Slider) {
        while (--n >= start) {
          let objN = this.HitObjects[n];
          if (objN instanceof Spinner)
            continue;
          if (this.HitObjects[j].startTime - objN.endTime > stackThreshold)
            break;
          if (objN.endPosition.distanceTo(this.HitObjects[j].position) <
              STACK_LENIENCE) {
            this.HitObjects[n].stackHeight = this.HitObjects[j].stackHeight + 1;
            // console.log("new stack height =", objN.stackHeight);
            j = n;
          }
        }
      }
    }
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
        if (offset < obj.endTime)
          return i;
      } else {
        if (offset <= obj.startTime)
          return i;
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
