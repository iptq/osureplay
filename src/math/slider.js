const Vector = require("./vector");

class SliderMath {
  static getCircumCircle(p1, p2, p3) {
    // get the [center, radius] circumcircle of the points p1, p2, p3
    var x1 = p1.x, y1 = p1.y, x2 = p2.x, y2 = p2.y, x3 = p3.x, y3 = p3.y;
    var D = 2 * (x1 * (y2 - y3) + x2 * (y3 - y1) + x3 * (y1 - y2));
    var Ux = ((x1 * x1 + y1 * y1) * (y2 - y3) + (x2 * x2 + y2 * y2) * (y3 - y1) + (x3 * x3 + y3 * y3) * (y1 - y2)) / D;
    var Uy = ((x1 * x1 + y1 * y1) * (x3 - x2) + (x2 * x2 + y2 * y2) * (x1 - x3) + (x3 * x3 + y3 * y3) * (x2 - x1)) / D;
    var center = new Vector(Ux, Uy);
    var r = center.distanceTo(new Vector(x1, y1));
    return [ center, r ];
  }
  static getEndPoint(curveType, sliderLength, points) {
    // determines the other endpoint of the slider
    // points is the set of control points
    // curveType and sliderLength are given in the .osu

    if (!curveType || !sliderLength || !points)
      return;
    switch (curveType) {
    case "linear":
      return SliderMath.pointOnLine(points[0], points[1], sliderLength);
    case "catmull":
      // not supported
      return;
    case "bezier":
      throw new Error("unimplemented");
    case "perfect":
      if (!points || points.length < 2)
        return undefined;
      if (points.length == 2)
        return SliderMath.pointOnLine(points[0], points[1], sliderLength);
      if (points.length > 3)
        return SliderMath.getEndPoint("bezier", sliderLength, points);

      var [circumCenter, radius] =
          SliderMath.getCircumCircle(points[0], points[1], points[2]);
      var radians = sliderLength / radius;
      if (SliderMath.isLeft(points[0], points[1], points[2]))
        radians *= -1;
      return SliderMath.rotate(circumCenter, points[1], radians);
    }
  }
  static isLine(a, b, c) {
    // checks if a, b, and c are on the same line
    return ((b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x)) == 0;
  }
  static pointOnLine(p1, p2, length) {
    // gets the point on the line from p1 to p2 that's length away from p1

    var fullLength = p1.distanceTo(p2);
    var n = fullLength - length;

    var x = (n * p1.x + length * p2.x) / fullLength;
    var y = (n * p1.y + length * p2.y) / fullLength;
    return new Vector(x, y);
  }
  static rotate(center, point, angle) {
    // rotates point by angle around center

    var nx = Math.cos(angle), ny = Math.sin(angle);
    return new Vector(
      nx * (point.x - center.x) - ny * (point.y - center.y) + center.x,
      ny * (point.x - center.x) + nx * (point.y - center.y) + center.y);
  }
}

module.exports = SliderMath;
