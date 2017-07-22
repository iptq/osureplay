const Canvas = require("canvas");
var Math2 = require("./../Math2");
var Bezier = Math2.Bezier;
var Vector = require("./../Vector");
const Skin = require("./../Skin");
const Util = require("./../Util");

const ratio = 744 / 384.0;

var curveTypes = {
	"C": "catmull",
	"B": "bezier",
	"L": "linear",
	"P": "pass-through",
	"catmull": "C",
	"bezier": "B",
	"linear": "L",
	"pass-through": "P"
};
var additionTypes = [null, "normal", "soft", "drum"];

class HitObject {
	static serializeSoundTypes(array) {
		var number = 0;
		if (array.indexOf("whistle") >= 0) number |= 2;
		if (array.indexOf("finish") >= 0) number |= 4;
		if (array.indexOf("clap") >= 0) number |= 8;
		return number;
	}
	static parseAdditions(str) {
		var additions = {};
		if (!str) return additions;
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
		if (!str) return additions;
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

		if ((soundType & 2) == 2) properties.soundTypes.push("whistle");
		if ((soundType & 4) == 4) properties.soundTypes.push("finish");
		if ((soundType & 8) == 8) properties.soundTypes.push("clap");
		if (properties.soundTypes.length === 0) properties.soundTypes.push("normal");

		if ((objectType & 1) == 1) {
			properties.additions = HitObject.parseAdditions(parts[5]);
			return new HitCircle(properties);
		} else if ((objectType & 2) == 2) {
			properties.repeatCount = parseInt(parts[6]);
			properties.pixelLength = parseFloat(parts[7]);
			properties.additions = HitObject.parseAdditions(parts[10]);
			properties.edges = [];
			properties.points = [properties.position];
			var points = (parts[5] || "").split("|");
			if (points.length) {
				properties.curveType = curveTypes[points[0]] || "unknown";
				for (i = 1; i < points.length; i += 1) {
					var coordinates = points[i].split(":");
					properties.points.push(new Vector(
						parseInt(coordinates[0]),
						parseInt(coordinates[1])
					));
				}
			}
			var edgeSounds = [];
			var edgeAdditions = [];
			if (parts[8]) edgeSounds = parts[8].split("|");
			if (parts[9]) edgeAdditions = parts[9].split("|");

			for (i = 0; i < properties.repeatCount + 1; i += 1) {
				var edge = {
					"soundTypes": [],
					"additions": HitObject.parseEdgeAdditions(edgeAdditions[i])
				};
				if (edgeSounds[i]) {
					var sound = parseInt(edgeSounds[i]);
					if ((sound & 2) == 2) edge.soundTypes.push("whistle");
					if ((sound & 4) == 4) edge.soundTypes.push("finish");
					if ((sound & 8) == 8) edge.soundTypes.push("clap");
					if (edge.soundTypes.length === 0) edge.soundTypes.push("normal");
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
		this.selected = false;
	}
	serialize() {
		throw "Not implemented.";
	}
	render() {
		throw "Not implemented.";
	}
	renderTimeline() {
		throw "Not implemented.";
	}
}

class HitCircle extends HitObject {
	constructor(properties) {
		super(properties);
		this.fadetime = 0.8;
	}
	serialize() {
		var parts = [];
		parts.push(this.position.x);
		parts.push(this.position.y);
		parts.push(this.startTime);
		parts.push(1 | (this.newCombo ? 4 : 0));
		parts.push(HitObject.serializeSoundTypes(this.soundTypes));
		var additions = [];
		additions.push(this.additions.sample ? additionTypes.indexOf(this.additions.sample) : 0);
		additions.push(this.additions.additionalSample ? additionTypes.indexOf(this.additions.additionalSample) : 0);
		additions.push(this.additions.customSampleIndex ? this.additions.customSampleIndex : 0);
		additions.push(this.additions.hitsoundVolume ? this.additions.hitsoundVolume : 0);
		additions.push("");
		parts.push(additions.join(":"));
		return parts.join(",");
	}
	flip() {
		this.position.y = 384 - this.position.y;
	}
	render(ctx, ctx2, t, ar, cs) {
		var r_as;
		let obj = this;
		// var i = this.beatmap.HitObjects.indexOf(this);
		// if (!colIndex || !comboNumber) {
		// 	if (!colIndex) colIndex = Editor.objc[i][0] % Editor.cols.length;
		// 	if (!comboNumber) comboNumber = Editor.objc[i][1];
		// }
		cs *= ratio;
		var offset = this.startTime;
		var [x, y] = Util.toScreenCoords(this.position.x, this.position.y);
		x -= cs / 2
		y -= cs / 2
		var td = (offset - t) / 1000.0;
		if (td > ar || td < 0) return false;
		ctx.save();
		if (td > 0) {
			ctx.globalAlpha = 2 * (1 - td / ar);
			r_as = cs * (2.5 * td / ar + 1);
			ctx.drawImage(Skin.resources["approachcircle-" + this.comboColor.hex()], x + cs / 2 - r_as / 2, y + cs / 2 - r_as / 2, r_as, r_as);
			ctx.drawImage(Skin.resources["hitcircle-" + this.comboColor.hex()], x, y, cs, cs);
		} else {
			ctx.globalAlpha = Math.max(1 + td / this.fadetime, 0);
			r_as = cs * Math.min(-td / ar + 1, 13 / 12);
			ctx.drawImage(Skin.resources["approachcircle-" + this.comboColor.hex()], x + cs / 2 - r_as / 2, y + cs / 2 - r_as / 2, r_as, r_as);
			ctx.drawImage(Skin.resources["hitcircle-" + this.comboColor.hex()], x, y, cs, cs);
		}

		var drawOverlay = function () {
			ctx.drawImage(Skin.resources["hitcircleoverlay"], x, y, cs, cs);
		};
		var drawNumber = function () {
			var num = Skin.resources["default-" + obj.comboNumber];
			var newh = num.height / Skin.resources["hitcircle"].height * cs * 3 / 4;
			var dh = newh / num.height;
			ctx.drawImage(num, x - num.width * dh / 2 + cs / 2, y - newh / 2 + cs / 2, num.width * dh, newh);
		};
		drawNumber();
		drawOverlay();
		ctx.restore();
		return true;
	}
}

class Slider extends HitObject {
	constructor(properties) {
		super(properties);
		this.fadetime = 0.25;
	}
	static getEndPoint(curveType, sliderLength, points) {
		if (!curveType || !sliderLength || !points) return;
		switch (curveType) {
			case "linear":
				return Math2.pointOnLine(points[0], points[1], sliderLength);
			case "catmull":
				// not supported
				return;
			case "bezier":
				if (!points || points.length < 2)
					return undefined;
				if (points.length == 2) {
					return Math2.pointOnLine(points[0], points[1], sliderLength);
				}
				points = points.slice();
				var bezier, previous, point;
				for (var i = 0, l = points.length; i < l; i += 1) {
					point = points[i];
					if (!point)
						continue;
					if (!previous) {
						previous = point;
						continue;
					}
					if (point.equals(previous)) {
						bezier = new Bezier(points.splice(0, i));
						sliderLength -= bezier.pxLength;
						i = 0; //, length = points.length;
					}
					previous = point;
				}
				bezier = new Bezier(points);
				return bezier.pointAtDistance(sliderLength);
			case "pass-through":
				if (!points || points.length < 2)
					return undefined;
				if (points.length == 2)
					return Math2.pointOnLine(points[0], points[1], sliderLength);
				if (points.length > 3)
					return Slider.getEndPoint("bezier", sliderLength, points);
				var [circumCenter, radius] = Math2.getCircumCircle(points[0], points[1], points[2]);
				var radians = sliderLength / radius;
				if (Math2.isLeft(points[0], points[1], points[2]))
					radians *= -1;
				return Math2.rotate(circumCenter, points[1], radians);
		}
	}
	calculate() {
		var timing = this.beatmap.getTimingPoint(this.startTime);
		if (timing) {
			var pxPerBeat = this.beatmap.SliderMultiplier * 100 * timing.velocity;
			var beatsNumber = (this.pixelLength * this.repeatCount) / pxPerBeat;
			this.duration = Math.ceil(beatsNumber * timing.beatLength);
			this.endTime = this.startTime + this.duration;
		}
		var endPoint = Slider.getEndPoint(this.curveType, this.pixelLength, this.points);
		if (endPoint) {
			this.endPosition = endPoint;
		} else {
			this.endPosition = this.points[this.points.length - 1];
		}
		if (this.curveType == "pass-through") {
			this.passthroughcircle = Math2.getCircumCircle(this.points[0], this.points[1], this.points[2]);
		}
		if (this.curveType == 'pass-through') {
			this.spline = Util.passthrough(this.points, this.pixelLength);
		} else if (this.curveType == 'line') {
			this.spline = Util.line(this.points, this.pixelLength)[0];
		} else { //assume it's a Bezier
			this.spline = Util.bezier(this.points, this.pixelLength);
			this.spline.splice(-1, 1, this.endPosition.toArray());
		}
		if (typeof Path2D != "undefined") {
			this.path = new Path2D();
			for (var j = 0; j < this.spline.length; j++) {
				this.path.lineTo(this.spline[j][0], this.spline[j][1]);
			}
		}
	}
	flip() {
		// this.position.y = 384 - this.position.y;
		for (var i = 0; i < this.points.length; ++i) {
			this.points[i].y = 384 - this.points[i].y;
		}
		this.calculate();
	}
	render(ctx, ctx2, t, ar, cs) {
		var posx, posy, r_as;
		// var i = this.beatmap.HitObjects.indexOf(this);
		// if (!t) t = Editor.source.t;
		// if (!colIndex || !comboNumber) {
		// 	if (!colIndex) colIndex = Editor.objc[i][0] % Editor.cols.length;
		// 	if (!comboNumber) comboNumber = Editor.objc[i][1];
		// }
		let obj = this;
		// cs *= ratio;
		let scs = cs * ratio;
		var offset = this.startTime;
		var [x, y] = Util.toScreenCoords(this.position.x, this.position.y);
		x -= scs / 2;
		y -= scs / 2;
		var td = (offset - t) / 1000.0;
		var endTime = this.endTime;
		if (td > ar || t > endTime + 0.8) return false;
		ctx.save();
		ctx2.save();
		if (td > 0) ctx.globalAlpha = 2 * (1 - td / ar);
		else {
			// ctx.globalAlpha = Math.max(1 - (t - endTime) / this.fadetime, 0);
			// ctx2.globalAlpha = Math.max(1 - (t - endTime) / this.fadetime, 0);
			ctx.globalAlpha = 1;
			ctx2.globalAlpha = 1;
		}
		let tmpcanvas = new Canvas();
		let tmpctx = tmpcanvas.getContext("2d");
		let render = Util.render_curve2(this.spline, cs);
		tmpcanvas.width = render[0][0].width * ratio * 2;
		tmpcanvas.height = render[0][0].height * ratio * 2;
		tmpctx.drawImage(render[0][0], 0, 0);
		tmpctx.globalCompositeOperation = 'destination-out';
		tmpctx.drawImage(render[0][1], 0, 0);
		tmpctx.globalCompositeOperation = 'source-over';
		tmpctx.globalAlpha = 0.75;
		tmpctx.drawImage(this.comboColor.tint(render[0][1]), 0, 0);
		tmpctx.drawImage(render[0][2], 0, 0);
		let [rx, ry] = Util.toScreenCoords(render[1][0], render[1][1]);
		let randoconst = 2.9/3;
		ctx.drawImage(tmpcanvas, rx, ry, tmpcanvas.width * randoconst, tmpcanvas.height * randoconst);
		if (false) {
			if (this.cache.col != Editor.cols[colIndex] || this.cache.cs != cs || this.cache.flag) {
				if (this.cache.cs != cs || !this.cache.cached || this.cache.flag) {
					this.cache.render = render_curve2(this.spline, cs);
					this.cache.flag = false;
				}
				this.cache.col = Editor.cols[colIndex];
				this.cache.cs = cs;
				var slider_border = Editor.skin._meta.options.SliderBorder ? colorToArray(Editor.skin._meta.options.SliderBorder) : undefined;
				var slider_trackcolor = Editor.skin._meta.options.SliderTrackOverride ? colorToArray(Editor.skin._meta.options.SliderTrackOverride) : Editor.cols[colIndex];
				this.cache.cached = document.createElement('canvas');
				this.cache.cached.width = this.cache.render[0][0].width;
				this.cache.cached.height = this.cache.render[0][0].height;
				var tempctx = this.cache.cached.getContext('2d');
				tempctx.drawImage(tint(this.cache.render[0][0], slider_border), 0, 0);
				tempctx.globalCompositeOperation = 'destination-out';
				tempctx.drawImage(this.cache.render[0][1], 0, 0);
				tempctx.globalCompositeOperation = 'source-over';
				tempctx.globalAlpha = 0.75;
				tempctx.drawImage(tint(this.cache.render[0][1], slider_trackcolor), 0, 0);
				tempctx.drawImage(this.cache.render[0][2], 0, 0);
			}
			ctx.drawImage(this.cache.cached, this.cache.render[1][0], this.cache.render[1][1], this.cache.cached.width / 2, this.cache.cached.height / 2);
		}
		var r = this.repeatCount;
		var timesRepeated = ((-td / this.duration * 1000.0) * this.repeatCount) | 0;
		let drawReverseArrow = function(x, y, angle) {
			let tmpcanvas = new Canvas();
			let tmpctx = tmpcanvas.getContext("2d");
			tmpcanvas.width = Skin.resources["hitcircle"].width;
			tmpcanvas.height = Skin.resources["hitcircle"].height;
			tmpctx.drawImage(Skin.resources["reversearrow"], (tmpcanvas.width - Skin.resources["reversearrow"].width) / 2, (tmpcanvas.height - Skin.resources["reversearrow"].height) / 2);
			tmpctx.rotate(angle);
			ctx.drawImage(tmpcanvas, x, y, scs, scs);
		};
		if (this.repeatCount > 1) {
			if (this.repeatCount > 2 && timesRepeated > 0 && timesRepeated <= this.repeatCount - 1) {
				let [bx, by] = [x, y];
				drawReverseArrow(bx, by, 0);
			}
			if (this.repeatCount > 1 && timesRepeated <= this.repeatCount - 2) {
				let randoconst2 = 0.28;
				let [bx, by] = Util.toScreenCoords(this.endPosition.x - scs * randoconst2, this.endPosition.y - scs * randoconst2);
				drawReverseArrow(bx, by, 0);
			}
		}

		// for (var p = 1; p < r; p++) {
		// 	r_as = scs * (2.5 * td / ar + 1);
		// 	// if (x >= 0)
		// 		// console.log("rendering end ", p, "; current iteration through slider", x);
		// 	var bx, by;
		// 	var angle = 0;
		// 	if (p % 2 == 0) { // starting end
		// 		[bx, by] = [x, y];
		// 	} else { // other end
		// 		// console.log(this.endPosition);
		// 		let randoconst2 = 0.28;
		// 		[bx, by] = Util.toScreenCoords(this.endPosition.x - scs * randoconst2, this.endPosition.y - scs * randoconst2);
		// 	}
		// 	let tmpcanvas = new Canvas();
		// 	let tmpctx = tmpcanvas.getContext("2d");
		// 	tmpcanvas.width = Skin.resources["hitcircle"].width;
		// 	tmpcanvas.height = Skin.resources["hitcircle"].height;
		// 	tmpctx.drawImage(Skin.resources["reversearrow"], (tmpcanvas.width - Skin.resources["reversearrow"].width) / 2, (tmpcanvas.height - Skin.resources["reversearrow"].height) / 2);
		// 	tmpctx.rotate(angle);
		// 	ctx.drawImage(tmpcanvas, bx, by, scs, scs);
		// 	//repeat arrows/slider ends
		// }
		if (td <= 0 && this.duration / 1000 + td > -0.2) {
			var prog = -td / this.duration * 1000; // progress percentage (0-1)
			var curp = prog * r; // current progress (equivalent to distance traveled divided by slider length)
			var dir = 1 - 2 * (Math.floor(curp) % 2); // direction the ball is traveling, 1 for normal, -1 for reverse
			var distance = curp % 1 * this.pixelLength;
			var j = dir == 1 ? 0 : this.spline.length - 1;
			var jend = dir == 1 ? this.spline.length - 1 : 0;
			while (j != jend) {
				var p1 = this.spline[j];
				var p2 = this.spline[j + dir];
				var dpart = Math.sqrt(Math.pow(p1[0] - p2[0], 2) + Math.pow(p1[1] - p2[1], 2));
				if (dpart > distance) {
					//without extra interpolation stuff
					//ctx.drawImage(Editor.skin['sliderb0'], p1[0] - cs / 2, p1[1] - cs / 2, cs, cs);
					if (this.duration / 1000 + td >= -0.001) {
						// console.log("shiet");
						posx = p1[0] + distance / dpart * (p2[0] - p1[0]);
						posy = p1[1] + distance / dpart * (p2[1] - p1[1]);
						[posx, posy] = Util.toScreenCoords(posx, posy);
						var cs2 = scs * 11 / 12;
						ctx2.save();
						ctx2.translate(posx, posy);
						ctx2.rotate(Math.atan2(p2[1] - p1[1], p2[0] - p1[0]) + (/*Editor.skin._meta.options.SliderBallFlip*/0 === 0 && dir == -1 ? Math.PI : 0));
						ctx2.drawImage(Skin.resources["sliderb0-" + this.comboColor.hex()], -cs2 / 2, -cs2 / 2, cs2, cs2);
						ctx2.restore();
					} else {
						var temp = r % 2 ? this.spline.length - 1 : 0;
						posx = this.spline[temp][0];
						posy = this.spline[temp][1];
					}
					ctx2.save();
					var r_fs = td > -0.1 ? scs * (1 - td * 10) : (td < -this.duration / 1000 ? 2 * scs + (td + this.duration / 1000) * 5 * 0.5 * scs : 2 * scs);
					ctx2.drawImage(Skin.resources["sliderfollowcircle"], posx - r_fs / 2, posy - r_fs / 2, r_fs, r_fs);
					ctx2.restore();
					break;
				} else {
					distance -= dpart;
				}
				j += dir;
			}
		}
		if (td > 0) {
			r_as = scs * (2.5 * td / ar + 1);
			ctx.drawImage(Skin.resources["approachcircle-" + this.comboColor.hex()], x + scs / 2 - r_as / 2, y + scs / 2 - r_as / 2, r_as, r_as);
			ctx.drawImage(Skin.resources["hitcircle-" + this.comboColor.hex()], x, y, scs, scs);
			var drawOverlay = function () {
				ctx.drawImage(Skin.resources["hitcircleoverlay"], x, y, scs, scs);
			};
			var drawNumber = function () {
				var num = Skin.resources["default-" + obj.comboNumber];
				var newh = num.height / Skin.resources["hitcircle"].height * scs * 3 / 4;
				var dh = newh / num.height;
				ctx.drawImage(num, x - num.width * dh / 2 + scs / 2, y - newh / 2 + scs / 2, num.width * dh, newh);
			};
			drawNumber();
			drawOverlay();
		} else {
			// ctx.globalAlpha = Math.max(1 + td / 0.8, 0);
			// r_as = cs * Math.min(-td / ar + 1, 13 / 12);
			// ctx.drawImage(Editor.skin['approachcircle' + colIndex], x + cs / 2 - r_as / 2, y + cs / 2 - r_as / 2, r_as, r_as);
			// ctx.drawImage(Editor.skin.hitcircle, x, y, cs, cs);
		}
		ctx.restore();
		ctx2.restore();
		return;

		if (parseInt(Editor.skin._meta.options.HitCircleOverlayAboveNumber || Editor.skin._meta.options.HitCircleOverlayAboveNumer, 10)) {
			drawNumber();
			drawOverlay();
		} else {
			drawOverlay();
			drawNumber();
		}
		ctx.restore();
		ctx2.restore();
		return true;
	}
}

class Spinner extends HitObject {
	constructor(properties) {
		super(properties);
		this.fadetime = 0.25;
	}
	flip() { }
	render(t, colIndex, comboNumber) {
		return;
		var dur = this.duration / 1000;
		var td = this.startTime / 1000 - t;
		if (this.endTime / 1000 + this.fadetime < t || td > 0.4) return false;
		var ctx = document.getElementById('gridcanvas').getContext('2d');
		ctx.save();
		ctx.globalCompositeOperation = "destination-over";
		ctx.translate(256, 192);
		var drawspinner = function (r, a, t, middle) {
			ctx.globalAlpha = a;
			if (!middle) middle = Editor.skin['spinner-middle'];
			ctx.drawImage(middle, -r * 1.01, -r * 1.01, 2.02 * r, 2.02 * r);
			ctx.drawImage(Editor.skin['spinner-middle2'], -r * 0.025, -r * 0.025, 2 * r * 0.025, 2 * r * 0.025);
			ctx.save();
			ctx.rotate(t * 4 * Math.PI);
			ctx.drawImage(Editor.skin['spinner-top'], -r, -r, 2 * r, 2 * r);
			ctx.restore();
			ctx.drawImage(Editor.skin['spinner-bottom'], -r, -r, 2 * r, 2 * r);
		};
		if (td < 0 && -td < dur) {
			//first one gradually has it turn red, lags more
			//drawspinner(172 + 40 * Math.sqrt(-td / dur), 1, td, tint(Editor.skin['spinner-middle'], [255, 255 * (1 + td / dur), 255 * (1 + td / dur)]));
			drawspinner(172 + 40 * Math.sqrt(-td / dur), 1, td);
		} else if (td > 0 && td < 0.4) {
			drawspinner(172, 1 - td / 0.4, 0);
		} else if (td < 0 && -td < dur + this.fadetime) {
			drawspinner(212, 1 + (dur + td) / 0.25, dur);
		}
		ctx.restore();
		return true;
	}
}

module.exports = HitObject;
module.exports.HitCircle = HitCircle;
module.exports.Slider = Slider;
module.exports.Spinner = Spinner;
