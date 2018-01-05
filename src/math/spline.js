const Vector = require("./vector");

class Spline {
  // in this context, a spline is literally just a list of points
  constructor() { this.points = []; }

  static bezier(points, length) { return new BezierSpline(points, length); }
  static linear(points, length) { return new LinearSpline(points, length); }
  static perfect(points, length) { return new PerfectSpline(points, length); }

  push(point) { this.points.push(point); }
}

class BezierSpline extends Spline {
  constructor(points, length) { super(); }
}

class LinearSpline extends Spline {
  constructor(points, length) {
    super();
    if (points.length != 2)
      throw new Error(
          "Linear slider with the wrong number of control points (expected: 2, got: " +
          points.length);

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
  constructor(points, length) { super(); }
}

module.exports = Spline;