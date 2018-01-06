class Vector {
  constructor(_x, _y) {
    this.x = _x;
    this.y = _y;
  }
  angleTo(other) {
    var dx = other.x - this.x;
    var dy = other.y - this.y;
    return Math.atan(dy / dx);
  }
  distanceTo(other) {
    var dx = other.x - this.x;
    var dy = other.y - this.y;
    return Math.sqrt(Math.pow(dx, 2) + Math.pow(dy, 2));
  }
  midpoint(other) {
    return new Vector((this.x + other.x) / 2, (this.y + other.y) / 2);
  }
  equals(other) { return this.x == other.x && this.y == other.y; }
  toPol() {
    // treating x, y as r, theta
    var x = this.x * Math.cos(this.y);
    var y = this.x * Math.sin(this.y);
    return new Vector(x, y);
  }
  get m() {
    // magnitude
    return Math.pow(this.x * this.x + this.y * this.y, 0.5);
  }
  get m2() { return this.x * this.x + this.y * this.y; }
  add(v) { return new Vector(this.x + v.x, this.y + v.y); }
  sub(v) { return new Vector(this.x - v.x, this.y - v.y); }
  smul(c) { return new Vector(c * this.x, c * this.y); }
  norm() { return new Vector(this.x / this.m, this.y / this.m); }
  toString(separator) {
    separator = separator || ",";
    return [ this.x, this.y ].join(separator);
  }
}

module.exports = Vector;
