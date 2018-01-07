const Canvas = require("canvas"), Image = Canvas.Image;

const SliderMath = require("./slider");
const Vector = require("./vector");
const constants = require("../constants");

class Spline {
  // in this context, a spline is literally just a list of points
  constructor(cs) {
    this.cs = cs;
    this.points = [];
  }

  static bezier(cs, points, length) {
    return new BezierSpline(cs, points, length);
  }
  static linear(cs, points, length) {
    if (points.length != 2)
      throw new Error(
          "Linear slider with the wrong number of control points (expected: 2, got: " +
          points.length + ")");

    return new LinearSpline(cs, points, length);
  }
  static perfect(cs, points, length) {
    if (points.length != 3)
      throw new Error(
          "Perfect slider with the wrong number of control points (expected: 3, got: " +
          points.length + ")");

    // if they're on a line, abort mission now
    if (SliderMath.isLine(points[0], points[1], points[2]))
      return Spline.linear(cs, [ points[0], points[1] ], length);

    return new PerfectSpline(cs, points, length);
  }

  push(point) { this.points.push(point); }

  prerender() {
    const K = 2.5;
    const randoconst = 2.9 / 3;
    let cs = this.cs * randoconst;

    // these are going to be full cuz i'm too lazy to calculate exactly how big
    // sliders are right now. guess i'll leave this as a
    // TODO: make slider pieces not retardedly sized
    this.image = new Canvas(constants.FULL_WIDTH, constants.FULL_HEIGHT);
    this.body = new Canvas(constants.FULL_WIDTH, constants.FULL_HEIGHT);
    this.border = new Canvas(constants.FULL_WIDTH, constants.FULL_HEIGHT);
    this.overlay = new Canvas(constants.FULL_WIDTH, constants.FULL_HEIGHT);

    let c1 = this.overlay.getContext("2d"), c2 = this.border.getContext("2d"),
        c3 = this.body.getContext("2d");
    var origin = this.points[0].add(new Vector(64, 48)).o2r();

    c1.save();
    c1.translate(origin.x, origin.y);
    c2.translate(origin.x, origin.y);
    c3.translate(origin.x, origin.y);

    c1.beginPath();
    c2.beginPath();
    c3.beginPath();

    c1.lineCap = c2.lineCap = c3.lineCap = "round";
    c1.lineJoin = c2.lineJoin = c3.lineJoin = "round";
    c1.moveTo(0, 0);
    c2.moveTo(0, 0);
    c3.moveTo(0, 0);

    for (let i = 1; i < this.points.length; ++i) {
      let position = this.points[i].add(new Vector(64, 48)).o2r().sub(origin);
      c1.lineTo(position.x, position.y);
      c2.lineTo(position.x, position.y);
      c3.lineTo(position.x, position.y);
    }

    // get that gradient effect
    // thanks alex
    for (let a = 0.0, i = 0; a < cs / K; ++i) {
      // console.log(i, a);
      c1.save();
      c1.lineWidth = c2.lineWidth = c3.lineWidth = cs - a * K;
      if (i === 0) {
        c2.strokeStyle = "white";
        a += cs / (10 * K);
        c2.stroke();
      } else {
        c1.globalAlpha = a / cs * K / 8;
        c1.strokeStyle = "white";
        a += K;
        c1.stroke();
        if (i === 1) {
          c3.save();
          c3.translate(-origin.x, -origin.y);
          c3.fillStyle = "white";
          c3.fillRect(0, 0, constants.FULL_WIDTH, constants.FULL_HEIGHT);
          c3.globalCompositeOperation = "destination-in";
          c3.stroke();
          c3.restore();
        }
      }
      c1.restore();
    }
    c1.restore();
    // intensify
    c1.globalCompositeOperation = "copy";
    c1.globalAlpha = 0.5;
    c1.drawImage(this.overlay, 0, 0);

    // let ctx = this.image.getContext("2d");
    // ctx.save();
    // ctx.drawImage(this.border, 0, 0);
    // ctx.globalCompositeOperation = "destination-out";
    // ctx.drawImage(this.body, 0, 0);
    // ctx.globalCompositeOperation = "source-over";
    // ctx.globalAlpha = 0.75;
    // ctx.drawImage(this.body, 0, 0);
    // ctx.drawImage(this.overlay, 0, 0);
    // ctx.restore();

    // const fs = require("fs");
    // fs.writeFileSync("lol.png", this.image.toBuffer());
    // process.exit(1);
  }
}

// thank based peppy
class BezierApproximator {
  // using the repeated subdividing method
  constructor(points) {
    this.points = points;
    this.leftDiv = [];
    this.rightDiv = [];
  }

  static isFlatEnough(curve) {
    for (var i = 1; i < curve.length - 1; ++i) {
      if ((curve[i - 1].sub(curve[i].smul(2)).add(curve[i + 1])).m2 >
          constants.bezierTolerance)
        return false;
    }
    return true;
  }

  calculate() {
    // curves that haven't been flattened out yet
    let toFlatten = [ this.points.slice(0) ];

    while (toFlatten.length > 0) {
      // get the next potentially unflattened curve
      let parent = toFlatten.pop();
      // don't flatten it if it's already flattened
      if (BezierApproximator.isFlatEnough(parent)) {
        continue;
      }
    }
    // TODO
    return this.points;
  }
}

class BezierSpline extends Spline {
  constructor(cs, points, length) {
    super(cs);
    let bezier = new BezierApproximator(points);
    this.points = bezier.calculate();
    this.prerender();
  }
}

class LinearSpline extends Spline {
  constructor(cs, points, length) {
    super(cs);
    // since we can just draw a single line from one point to another we don't
    // need a million points

    // start point
    this.points.push(points[0]);

    // end point determined by length of slider
    // v1 = p0 + ((p1 - p0) * length / |p1 - p0|)
    let unit = points[1].sub(points[0]).norm();
    this.points.push(points[0].add(unit.smul(length)));
    this.prerender();
  }
}

class PerfectSpline extends Spline {
  constructor(cs, points, length) {
    super(cs);
    // get circumcircle
    let [center, radius] =
        SliderMath.getCircumCircle(points[0], points[1], points[2]);

    // figure out what t-values the slider begins and ends at
    let t0 = Math.atan2(center.y - points[0].y, points[0].x - center.x);
    let t1 = Math.atan2(center.y - points[2].y, points[2].x - center.x);

    let mid = Math.atan2(center.y - points[1].y, points[1].x - center.x);
    while (mid < t0)
      mid += 2 * Math.PI;
    while (t1 < t0)
      t1 += 2 * Math.PI;
    if (mid > t1)
      t1 -= 2 * Math.PI;

    // circumference is 2*pi*r, slider length over circumference is
    // length/(2*pi*r)
    // limit t1 by pixel length, so new t1 is 2*pi*length/(2*pi*r) = length/r
    let direction = (t1 - t0) / Math.abs(t1 - t0);
    let nt1 = t0 + direction * (length / radius);

    // construct the circle parametrically
    for (var t = t0; nt1 >= t0 ? t < nt1 : t > nt1; t += (nt1 - t0) / length) {
      let rel = new Vector(Math.cos(t) * radius, -Math.sin(t) * radius);
      this.points.push(center.add(rel));
    }
    this.prerender();
  }
}

module.exports = Spline;