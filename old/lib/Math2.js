var Vector = require("./Vector");

var array_values = function (array) {
	var out = [];
	for (var key in array) out.push(array[key]);
	return out;
};

class Math2 {
	static Cpn(p, n) {
		var out;
		if (p < 0 || p > n)
			return 0;
		p = Math.min(p, n - p);
		out = 1;
		for (var i = 1; i < p + 1; i += 1)
			out = out * (n - p + i) / i;
		return out;
	}
	static distanceFromPoints(array) {
		var distance = 0;
		for (var i = 1; i < array.length; i += 1) {
			distance += array[i].distanceTo(array[i - 1]);
		}
		return distance;
	}
	static isLeft(a, b, c) {
		return ((b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x)) < 0;
	}
	static getCircumCircle(p1, p2, p3) {
		var x1 = p1.x,
			y1 = p1.y,
			x2 = p2.x,
			y2 = p2.y,
			x3 = p3.x,
			y3 = p3.y;
		var D = 2 * (x1 * (y2 - y3) + x2 * (y3 - y1) + x3 * (y1 - y2));
		var Ux = ((x1 * x1 + y1 * y1) * (y2 - y3) + (x2 * x2 + y2 * y2) * (y3 - y1) + (x3 * x3 + y3 * y3) * (y1 - y2)) / D;
		var Uy = ((x1 * x1 + y1 * y1) * (x3 - x2) + (x2 * x2 + y2 * y2) * (x1 - x3) + (x3 * x3 + y3 * y3) * (x2 - x1)) / D;
		var center = new Vector(Ux, Uy);
		var r = center.distanceTo(new Vector(x1, y1));
		return [center, r];
	}
	static pointAtDistance(array, distance) {
		var current_distance = 0,
			last_distance = 0,
			coord, angle, cart, new_distance;
		if (array.length < 2)
			return [new Vector(0, 0), new Vector(0, 0)];
		if (distance === 0) {
			angle = array[0].angleTo(array[1]);
			return [array[0], new Vector(angle, 0)];
		}
		if (Math2.distanceFromPoints(array) <= distance) {
			angle = array[array.length - 2].angleTo(array[array.length - 1]);
			return [array[array.length - 1], new Vector(angle, array.length - 2)];
		}
		for (var i = 0; i < array.length - 1; i += 1) {
			new_distance = array[i].distanceTo(array[i + 1]);
			current_distance += new_distance;
			if (distance <= current_distance) break;
		}
		current_distance -= new_distance;
		if (distance == current_distance) {
			coord = array[i];
			angle = array[i].angleTo(array[i + 1]);
		} else {
			angle = array[i].angleTo(array[i + 1]);
			cart = new Vector(distance - current_distance, angle);
			if (array[i].x > array[i + 1].x)
				coord = new Vector(array[i].x - cart.x, array[i].y - cart.y);
			else
				coord = new Vector(array[i].x + cart.x, array[i].y + cart.y);
		}
		return [coord, new Vector(angle, i)];
	}
	static pointOnLine(p1, p2, length) {
		var fullLength = p1.distanceTo(p2);
		var n = fullLength - length;

		var x = (n * p1.x + length * p2.x) / fullLength;
		var y = (n * p1.y + length * p2.y) / fullLength;
		return new Vector(x, y);
	}
	static rotate(center, point, angle) {
		var nx = Math.cos(angle),
			ny = Math.sin(angle);
		return new Vector(nx * (point.x - center.x) - ny * (point.y - center.y) + center.x, ny * (point.x - center.x) + nx * (point.y - center.y) + center.y);
	}
}

class Bezier {
	constructor(points) {
		this.points = points;
		this.order = points.length;

		this.step = 0.0025 / this.order;
		this.pos = {};
		this.calcPoints();
	}
	at(t) {
		if (typeof this.pos[t] !== "undefined") return this.pos[t];
		var x = 0,
			y = 0;
		var n = this.order - 1;
		for (var i = 0; i <= n; i += 1) {
			var c = Math2.Cpn(i, n) * Math.pow((1 - t), (n - i)) * Math.pow(t, i);
			x += c * this.points[i].x;
			y += c * this.points[i].y;
		}
		this.pos[t] = new Vector(x, y);
		return new Vector(x, y);
	}
	calcPoints() {
		if (Object.keys(this.pos).length)
			return;
		this.pxLength = 0;
		var prev = this.at(0),
			current;
		for (var i = 0; i < 1 + this.step; i += this.step) {
			current = this.at(i);
			this.pxLength += prev.distanceTo(current);
			prev = current;
		}
	}
	pointAtDistance(dist) {
		switch (this.order) {
			case 0:
				return false;
			case 1:
				return this.points[0];
			default:
				this.calcPoints();
				return Math2.pointAtDistance(array_values(this.pos), dist)[0];
		}
	}
}

module.exports = Math2;
module.exports.Bezier = Bezier;
