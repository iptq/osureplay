const Canvas = require("canvas");

const Vector = require("../math/vector");
const SliderMath = require("../math/slider");
const Spline = require("../math/spline");
const constants = require("../constants");
const utils = require("../utils");

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
    properties.startTime = properties.endTime = parseInt(parts[2]);
    properties.soundTypes = [];
    properties.newCombo = (objectType & 4) == 4;
    properties.position = properties.endPosition =
        new Vector(parseInt(parts[0]), parseInt(parts[1]));
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
  getRealCoordinates() {
    let stackOffset = this.radius / 20;
    let stackVector = new Vector(stackOffset, stackOffset);
    return this.position.add(new Vector(64, 48))
        .o2r()
        .sub(stackVector.smul(this.stackHeight));
  }
  render(player) { throw "Not implemented."; }
}

class HitCircle extends HitObject {
  constructor(properties) {
    super(properties);
    this.fadetime = 0.8;
  }
  render(player, timestamp) {
    let ctx = player.ctx;
    ctx.save();

    let CS = player.beatmap.RealCS;
    let position = this.getRealCoordinates();
    ctx.translate(position.x, position.y);

    let drawApproachCircle = () => {
      let radius = CS * (2.5 * (this.startTime - timestamp) /
                             player.beatmap.ReactionTime +
                         1);
      ctx.drawImage(player.skin.get("approachcircle", {tint : this.comboColor}),
                    -radius / 2, -radius / 2, radius, radius);
    };
    let drawHitCircle = (fadeOutPercent = 0) => {
      ctx.save();
      let cs = CS * (1 + 0.5 * fadeOutPercent);
      ctx.globalAlpha = 1 - fadeOutPercent;
      ctx.drawImage(player.skin.get("hitcircle", {tint : this.comboColor}),
                    -cs / 2, -cs / 2, cs, cs);
      ctx.drawImage(player.skin.get("hitcircleoverlay"), -cs / 2, -cs / 2, cs,
                    cs);

      let fixedNumberHeight = cs * 0.3; // totally arbitrary
      let fullNumberWidth = 0;
      let number = this.comboNumber.toString();
      let numberData = [];
      for (var i = 0; i < number.length; ++i) {
        let image = player.skin.get("default-" + number.charAt(i));
        let width = image.width * fixedNumberHeight / image.height;
        fullNumberWidth += width;
        numberData.push([ image, width ]);
      }
      let x = -fullNumberWidth / 2;
      for (var i = 0; i < numberData.length; ++i) {
        let [image, width] = numberData[i];
        ctx.drawImage(image, x, -fixedNumberHeight / 2, width,
                      fixedNumberHeight);
        x += width;
      }
      ctx.restore();
    };

    // before the circle's hit time:
    //  - TODO: fade it in (possibly?)
    //  - draw approach circle
    //  - make sure circle is fully visible for the duration determined by AR
    if (this.startTime - player.beatmap.ReactionTime <= timestamp &&
        timestamp <= this.startTime) {
      drawHitCircle();
      drawApproachCircle();
    }

    // after the circle's hit time:
    //  - TODO: fade it out (possibly?)
    //  i guess it's supposed to be visible until after startTime + hit50?
    if (this.endTime <= timestamp &&
        timestamp <= this.endTime + constants.CIRCLE_FADE_OUT_TIME) {
      drawHitCircle((timestamp - this.endTime) /
                    constants.CIRCLE_FADE_OUT_TIME);
    }

    // score indicator (miss/50/100/300)

    ctx.restore();
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
      this.spline = Spline.linear(this.radius, this.points, this.pixelLength);
      break;
    case "bezier":
      this.spline = Spline.bezier(this.radius, this.points, this.pixelLength);
      break;
    case "perfect":
      this.spline = Spline.perfect(this.radius, this.points, this.pixelLength);
      break;
    }
    // last point is the end position
    this.endPosition = this.spline.points[this.spline.points.length - 1];
  }
  render(player, timestamp) {
    let ctx = player.ctx;
    ctx.save();

    let CS = player.beatmap.RealCS;
    let position = this.getRealCoordinates();
    ctx.translate(position.x, position.y);

    let drawApproachCircle = () => {
      let radius = CS * (2.5 * (this.startTime - timestamp) /
                             player.beatmap.ReactionTime +
                         1);
      ctx.drawImage(player.skin.get("approachcircle", {tint : this.comboColor}),
                    -radius / 2, -radius / 2, radius, radius);
    };
    let drawHitCircle = (fadeOutPercent = 0) => {
      ctx.save();
      let cs = CS * (1 + 0.5 * fadeOutPercent);
      ctx.globalAlpha = 1 - fadeOutPercent;
      ctx.drawImage(player.skin.get("hitcircle", {tint : this.comboColor}),
                    -cs / 2, -cs / 2, cs, cs);
      ctx.drawImage(player.skin.get("hitcircleoverlay"), -cs / 2, -cs / 2, cs,
                    cs);

      let fixedNumberHeight = cs * 0.3; // totally arbitrary
      let fullNumberWidth = 0;
      let number = this.comboNumber.toString();
      let numberData = [];
      for (var i = 0; i < number.length; ++i) {
        let image = player.skin.get("default-" + number.charAt(i));
        let width = image.width * fixedNumberHeight / image.height;
        fullNumberWidth += width;
        numberData.push([ image, width ]);
      }
      let x = -fullNumberWidth / 2;
      for (var i = 0; i < numberData.length; ++i) {
        let [image, width] = numberData[i];
        ctx.drawImage(image, x, -fixedNumberHeight / 2, width,
                      fixedNumberHeight);
        x += width;
      }
      ctx.restore();
    };
    let drawSliderBody = () => {
      ctx.save();
      ctx.translate(-position.x, -position.y);
      ctx.drawImage(this.spline.border, 0, 0);
      ctx.globalCompositeOperation = "destination-out";
      ctx.globalAlpha = 1;

      let tmp = new Canvas(constants.FULL_WIDTH, constants.FULL_HEIGHT);
      let c1 = tmp.getContext("2d");
      c1.globalAlpha = 0.9;
      c1.drawImage(
          utils.tint(`slider:${this.id}`, this.spline.body, this.comboColor), 0,
          0);
      c1.drawImage(this.spline.overlay, 0, 0);

      ctx.drawImage(tmp, 0, 0);
      ctx.restore();
    };
    let drawSliderBall = () => {};

    // before the slider's hit time:
    //  - TODO: fade it in (possibly?)
    //  - draw approach circle
    //  - make sure circle is fully visible for the duration determined by AR
    //  - draw slider body
    if (this.startTime - player.beatmap.ReactionTime <= timestamp &&
        timestamp <= this.startTime) {
      drawSliderBody();
      drawHitCircle();
      drawApproachCircle();
    }

    // during the slider's body
    //  - draw the ball (DIRECTION!)
    //  - draw the follow circle (later lol)
    //  - remember the number of repeats i guess
    if (this.startTime <= timestamp && timestamp <= this.endTime) {
      drawSliderBody();
      drawSliderBall();
    }

    if (this.startTime <= timestamp &&
        timestamp <= this.startTime + constants.CIRCLE_FADE_OUT_TIME) {
      drawHitCircle((timestamp - this.startTime) /
                    constants.CIRCLE_FADE_OUT_TIME);
    }

    // after the slider's body time:
    //  - TODO: fade it out (possibly?)

    // score indicator (miss/50/100/300)

    ctx.restore();
  }
  hrFlip() {
    // this.position.y = 384 - this.position.y;
    for (var i = 0; i < this.points.length; ++i)
      this.points[i].y = 384 - this.points[i].y;
    this.calculate();
  }
}

class Spinner extends HitObject {
  constructor(properties) {
    super(properties);
    this.fadetime = 0.25;
  }
  render(player, timestamp) {
    // f
  }
  hrFlip() {}
}

module.exports = HitObject;
module.exports.HitCircle = HitCircle;
module.exports.Slider = Slider;
module.exports.Spinner = Spinner;
