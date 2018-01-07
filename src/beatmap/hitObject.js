const Vector = require("../math/vector");
const SliderMath = require("../math/slider");
const Spline = require("../math/spline");
const constants = require("../constants");

var curveTypes = {
  "C" : "catmull",
  "B" : "bezier",
  "L" : "linear",
  "P" : "perfect",
  "catmull" : "C",
  "bezier" : "B",
  "linear" : "L",
  "perfect" : "P"
};
var additionTypes = [ null, "normal", "soft", "drum" ];

class HitObject {
  static parseAdditions(str) {
    var additions = {};
    if (!str)
      return additions;
    var parts = str.split(":");

    if (parts[0] && parts[0] !== "0")
      additions.sample = additionTypes[parseInt(parts[0])];
    if (parts[1] && parts[1] !== "0")
      additions.additionalSample = additionTypes[parseInt(parts[1])];
    if (parts[2] && parts[2] !== "0")
      additions.customSampleIndex = parseInt(parts[2]);
    if (parts[3] && parts[3] !== "0")
      additions.hitsoundVolume = parseInt(parts[3]);
    if (parts[4] && parts[4] !== "0")
      additions.hitsound = parts[4];
    return additions;
  }
  static parseEdgeAdditions(str) {
    var additions = {};
    if (!str)
      return additions;
    var parts = str.split(":");

    if (parts[0] && parts[0] !== "0")
      additions.sampleset = additionTypes[parseInt(parts[0])];
    if (parts[1] && parts[1] !== "0")
      additions.additionsSampleset = additionTypes[parseInt(parts[1])];
    return additions;
  }
  static parse(line) {
    var parts = line.split(",");
    var soundType = parseInt(parts[4]);
    var objectType = parseInt(parts[3]);
    var properties = {};
    var i;

    properties.judged = false; // whether or not the object has produced points
    properties.originalLine = line;
    properties.startTime = parseInt(parts[2]);
    properties.soundTypes = [];
    properties.newCombo = (objectType & 4) == 4;
    properties.position = new Vector(parseInt(parts[0]), parseInt(parts[1]));
    properties.customColor = (objectType >>> 4) & 7;

    if ((soundType & 2) == 2)
      properties.soundTypes.push("whistle");
    if ((soundType & 4) == 4)
      properties.soundTypes.push("finish");
    if ((soundType & 8) == 8)
      properties.soundTypes.push("clap");
    if (properties.soundTypes.length === 0)
      properties.soundTypes.push("normal");

    if ((objectType & 1) == 1) {
      properties.additions = HitObject.parseAdditions(parts[5]);
      return new HitCircle(properties);
    } else if ((objectType & 2) == 2) {
      properties.repeatCount = parseInt(parts[6]);
      properties.pixelLength = parseFloat(parts[7]);
      properties.additions = HitObject.parseAdditions(parts[10]);
      properties.edges = [];
      properties.points = [ properties.position ];
      var points = (parts[5] || "").split("|");
      if (points.length) {
        properties.curveType = curveTypes[points[0]] || "unknown";
        for (i = 1; i < points.length; i += 1) {
          var coordinates = points[i].split(":");
          properties.points.push(
              new Vector(parseInt(coordinates[0]), parseInt(coordinates[1])));
        }
      }
      var edgeSounds = [];
      var edgeAdditions = [];
      if (parts[8])
        edgeSounds = parts[8].split("|");
      if (parts[9])
        edgeAdditions = parts[9].split("|");

      for (i = 0; i < properties.repeatCount + 1; i += 1) {
        var edge = {
          "soundTypes" : [],
          "additions" : HitObject.parseEdgeAdditions(edgeAdditions[i])
        };
        if (edgeSounds[i]) {
          var sound = parseInt(edgeSounds[i]);
          if ((sound & 2) == 2)
            edge.soundTypes.push("whistle");
          if ((sound & 4) == 4)
            edge.soundTypes.push("finish");
          if ((sound & 8) == 8)
            edge.soundTypes.push("clap");
          if (edge.soundTypes.length === 0)
            edge.soundTypes.push("normal");
        } else {
          edge.soundTypes.push("normal");
        }
        properties.edges.push(edge);
      }

      return new Slider(properties);
    } else if ((objectType & 8) == 8) {
      properties.endTime = parseInt(parts[5]);
      properties.duration = properties.endTime - properties.startTime;
      properties.additions = HitObject.parseAdditions(parts[6]);
      return new Spinner(properties);
    }
  }
  constructor(properties) {
    for (var key in properties) {
      this[key] = properties[key];
    }
    this.stackHeight = 0;
  }
  realCoordinates() {
    let stackOffset = this.radius / 10;
    let stackVector = new Vector(stackOffset, stackOffset);
    stackVector.smul(stackHeight);
    return this.position.o2r().sub(stackVector);
  }
  render(player) { throw "Not implemented."; }
}

class HitCircle extends HitObject {
  constructor(properties) {
    super(properties);
    this.fadetime = 0.8;
  }
  render(player) {
    let ctx = player.ctx;
    // before the circle's hit time:
    //  - TODO: fade it in (possibly?)
    //  - make sure circle is fully visible for the duration determined by AR
  }
  hrFlip() { this.position.y = 384 - this.position.y; }
}

class Slider extends HitObject {
  constructor(properties) {
    super(properties);
    this.fadetime = 0.25;
  }
  calculate() {
    var timing = this.beatmap.getTimingPoint(this.startTime);
    if (timing) {
      var pxPerBeat = this.beatmap.SliderMultiplier * 100 * timing.velocity;
      var beatsNumber = (this.pixelLength * this.repeatCount) / pxPerBeat;
      this.duration = Math.ceil(beatsNumber * timing.beatLength);
      this.endTime = this.startTime + this.duration;
    }
    switch (this.curveType) {
    case "linear":
      this.spline = Spline.linear(this.points, this.pixelLength);
      break;
    case "bezier":
      this.spline = Spline.bezier(this.points, this.pixelLength);
      break;
    case "perfect":
      this.spline = Spline.perfect(this.points, this.pixelLength);
      break;
    }
  }
  render(player) {
    // f
  }
  hrFlip() {
    // this.position.y = 384 - this.position.y;
    for (var i = 0; i < this.points.length; ++i) {
      this.points[i].y = 384 - this.points[i].y;
    }
    this.calculate();
  }
}

class Spinner extends HitObject {
  constructor(properties) {
    super(properties);
    this.fadetime = 0.25;
  }
  render(player) {
    // f
  }
  hrFlip() {}
}

module.exports = HitObject;
module.exports.HitCircle = HitCircle;
module.exports.Slider = Slider;
module.exports.Spinner = Spinner;
