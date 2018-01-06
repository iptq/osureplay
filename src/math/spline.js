const SliderMath = require("./slider");
const Vector = require("./vector");
const constants = require("../constants");

class Spline {
  // in this context, a spline is literally just a list of points
  constructor() { this.points = []; }

  static bezier(points, length) { return new BezierSpline(points, length); }
  static linear(points, length) {
    if (points.length != 2)
      throw new Error(
          "Linear slider with the wrong number of control points (expected: 2, got: " +
          points.length + ")");

    return new LinearSpline(points, length);
  }
  static perfect(points, length) {
    if (points.length != 3)
      throw new Error(
          "Perfect slider with the wrong number of control points (expected: 3, got: " +
          points.length + ")");

    // if they're on a line, abort mission now
    if (SliderMath.isLine(points[0], points[1], points[2]))
      return linear(points, length);

    return new PerfectSpline(points, length);
  }

  push(point) { this.points.push(point); }
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
  }
}

class BezierSpline extends Spline {
  constructor(points, length) {
    super();
    let bezier = new BezierApproximator(points);
    this.points = bezier.calculate();
  }
}

class LinearSpline extends Spline {
  constructor(points, length) {
    super();
    // since we can just draw a single line from one point to another we don't
    // need a million points

    // start point
    this.points.push(points[0]);

    // end point determined by length of slider
    // v1 = p0 + ((p1 - p0) * length / |p1 - p0|)
    let unit = points[1].sub(points[0]).norm();
    this.points.push(points[0].add(unit.smul(length)));
  }
}

class PerfectSpline extends Spline {
  constructor(points, length) {
    super();
    // get circumcircle
    let [center, radius] =
        SliderMath.getCircumCircle(points[0], points[1], points[2]);

    // figure out what t-values the slider begins and ends at
    let t0 = Math.atan2(points[0].y - center.y, points[0].x - center.x);
    let t1 = Math.atan2(points[2].y - center.y, points[2].x - center.x);

    // correct the order on the circle
    let mid = Math.atan2(points[1].y - center.y, points[1].x - center.x);
    while (mid < t0)
      mid += 2 * Math.PI;
    while (t1 < t0)
      t1 += 2 * Math.PI;
    if (mid > t1)
      t1 - 2 * Math.PI;

    // circumference is 2*pi*r, slider length over circumference is
    // length/(2*pi*r)
    // limit t1 by pixel length, so new t1 is 2*pi*length/(2*pi*r) = length/r
    let nt1 = t0 + length / radius;

    // construct the circle parametrically
    // 15 totally arbitrary constant btw
    for (var t = t0; t < nt1; t += (t1 - t0) / (length * 15)) {
      let rel = new Vector(Math.cos(t) * radius, Math.sin(t) * radius);
      this.points.push(center.add(rel));
    }
  }
}

module.exports = Spline;