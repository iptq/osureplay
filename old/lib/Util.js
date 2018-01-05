const Canvas = require("canvas"),
	Image = Canvas.Image;
const Vector = require("./Vector");

const WIDTH = 1920;
const HEIGHT = 1080;
const SWIDTH = 992;
const SHEIGHT = 744;

String.prototype.pad = function(length, fill) {
	fill = fill || "0";
	var padded = Array(length + 1).join("0") + this;
	return padded.substring(padded.length - length);
};

var cspx = function (n) {
    return 88 - 8 * (n - 2);
};

var ars = function (n) {
    return parseFloat((1.2 - (n >= 5 ? (n - 5) * 0.15 : (n - 5) * 0.12)).toFixed(4));
};

var ods = function (n) {
    return [0.0795 - 0.006 * n, 0.1395 - 0.008 * n, 0.1995 - 0.01 * n];
};

var e = function (img) { // check if image is empty
    return img.width === 0 && img.height === 0;
};

var snap = function (n, a, b) {
    return Math.max(0, Math.round((Math.round((n - a) / b) * b + a) * 1000) / 1000);
};

var tint = function (img, col) {
    if (col === undefined) return img;
    var canvas = document.createElement('canvas');
    canvas.height = img.height;
    canvas.width = img.width;
    var ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0);
    var w = img.width,
        h = img.height;
    if (!w || !h) return img;
    var imgdata = ctx.getImageData(0, 0, w, h);
    var rgba = imgdata.data;
    //console.log(imgdata.data);
    for (var px = 0, ct = w * h * 4; px < ct; px += 4) {
        rgba[px] *= col[0] / 255;
        rgba[px + 1] *= col[1] / 255;
        rgba[px + 2] *= col[2] / 255;
    }
    ctx.putImageData(imgdata, 0, 0);
    return canvas;
};

var colorToArray = function (s) {
    var color = s.split(',');
    var temp = [];
    for (var i = 0; i < color.length; i++) {
        temp.push(parseFloat(color[i]));
    }
    return temp;
};

var pow = Math.pow;

Array.prototype.equals = function (other) {
    if (this.length !== other.length) return false;
    for (var i = 0; i < this.length; i++) {
        if (this[i] != other[i]) return false;
    }
    return true;
};

var toRGB = function (arr) { // from an array of numbers in range 0-255 to rgb or rgba color string
    var [r, g, b, a] = arr;
    return a === undefined ? 'rgb(' + Math.round(r) + ',' + Math.round(g) + ',' + Math.round(b) + ')' : 'rgba(' + Math.round(r) + ',' + Math.round(g) + ',' + Math.round(b) + ',' + a + ')';
};

var min = function (arr) {
    var m = arr[0];
    for (var i = 1; i < arr.length; i++) {
        if (arr[i] < m) m = arr[i];
    }
    return m;
};

var max = function (arr) {
    var m = arr[0];
    for (var i = 1; i < arr.length; i++) {
        if (arr[i] > m) m = arr[i];
    }
    return m;
};

var sum = function (arr) {
    var r = 0;
    for (var i = 0; i < arr.length; i++) r += arr[i];
    return r;
};

var fa = function (n) {
    var r = 1;
    for (var i = 2; i <= n; i++)
        r *= i;
    return r;
};

var bcoef = function (n, k) {
    return fa(n) / fa(k) / fa(n - k);
};

var spline_len = function (p) {
    var l = 0;
    for (var i = 0; i < p.length - 1; i++) {
        l += dist(p[i], p[i + 1]);
    }
    return l;
};

var lenp = function (p) {
    var n = p.length - 1;
    if (n == 1) return p[0].distanceTo(p[1]);
    var [px, py] = p[0].toArray();
    var l = 0;
    for (var s = 0; s < 101; s++) {
        var t = s / 100;
        var x = 0;
        for (var i = 0; i < n + 1; i++) {
            x += bcoef(n, i) * pow(1 - t, n - i) * pow(t, i) * p[i].x;
        }
        var y = 0;
        for (i = 0; i < n + 1; i++) {
            y += bcoef(n, i) * pow(1 - t, n - i) * pow(t, i) * p[i].y;
        }
        l += new Vector(x, y).distanceTo(new Vector(px, py));
        px = x;
        py = y;
    }
    return l;
};

class Util {
	static randomString(length, chars) {
		length = length || 32;
		chars = chars || "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
		var result = "";
		for (var i = length; i > 0; --i) result += chars[Math.floor(Math.random() * chars.length)];
		return result;
	}
	static toScreenCoords(x, y) {
		let xratio = SWIDTH / 512.0;
		let yratio = SHEIGHT / 384.0;
		x *= xratio;
		y *= yratio;
		x += (WIDTH - SWIDTH) / 2;
		y += (HEIGHT - SHEIGHT) / 2;
		return [x, y];
	}
	static concatImages(arr, overlap) {
	    if (!overlap) overlap = 0;
	    let maxh = arr[0].height,
	        w = arr[0].width;
	    for (let i = 1; i < arr.length; i++) {
	        if (arr[i].height > maxh) maxh = arr[i].height;
	        w += arr[i].width - overlap;
	    }
	    let canvas = new Canvas(w, maxh);
	    let x = 0;
	    let ctx = canvas.getContext('2d');
	    for (let i = 0; i < arr.length; i++) {
	        ctx.drawImage(arr[i], x, (maxh - arr[i].height) / 2);
	        x += arr[i].width - overlap;
	    }
	    return canvas;
	}
	static line(p, l) {
	    // if (l === undefined) l = -1;
	    // if (step === undefined) step = 10;
	    var dx = p[1].x - p[0].x,
	        dy = p[1].y - p[0].y;
	    var m = Math.sqrt(pow(dx, 2) + pow(dy, 2));
	    if (l === undefined) l = m;
	    dx /= m;
	    dy /= m;
	    // var a = [];
	    // for (var i = 0; i < Math.round(l / step); i++) {
	    //   a.push([p[0][0] + dx * i, p[0][1] + dy * i]);
	    // }
	    return [
	        [
	            [p[0].x, p[0].y],
	            [p[0].x + dx * l, p[0].y + dy * l]
	        ], l
	    ];
	}
	static bezier2(p, l) {
	    if (l === undefined) l = lenp(p);
	    var prec = l / 40;
	    var n = p.length - 1;

	    function b(t) {
	        var x = 0;
	        for (var i = 0; i < n + 1; i++) {
	            x += bcoef(n, i) * pow(1 - t, n - i) * pow(t, i) * p[i].x;
	        }
	        var y = 0;
	        for (i = 0; i < n + 1; i++) {
	            y += bcoef(n, i) * pow(1 - t, n - i) * pow(t, i) * p[i].y;
	        }
	        return [x, y];
	    }
	    var arr = [],
	        l1 = 0;
	    var [px, py] = p[0].toArray();
	    var x, y, dx, dy, m, t;
	    for (var i = 0; i < Math.floor(l / prec); i++) {
	        t = i * prec / l;
	        [x, y] = b(t);
	        dx = x - px;
	        dy = y - py;
	        m = Math.sqrt(pow(dx, 2) + pow(dy, 2));
	        if (m !== 0 && l1 + m >= l) return [arr.concat([
	            [px + dx / m * (l1 - l), py + dy / m * (l1 - l)]
	        ]), l];
	        arr.push([x, y]);
	        l1 += m;
	        px = x;
	        py = y;
	    }
	    return [arr, l1];
	}
	static bezier(p, l) {
	    if (p.length == 2) return Util.line(p, l)[0];
	    var arr = [];
	    var prev = 0;
	    var part, c;
	    for (var i = 1; i < p.length + 1; i++) {
	        if (i == p.length) {
	            part = p.slice(prev, i);
	            c = Util.bezier2(part, l);
	            arr = arr.concat(c[0]);
	        } else if (i < p.length && p[i].equals(p[i - 1])) {
	            part = p.slice(prev, i);
	            c = part.length == 2 ? Util.line(part) : Util.bezier2(part);
	            c[0].pop();
	            arr = arr.concat(c[0]);
	            l -= c[1];
	            prev = i;
	        }
	    }
	    if (arr.length === 0) arr = bezier2(p)[0];
	    return arr;
	}
	static passthrough(p, l, step) {
	    if (step === undefined) step = 4;
	    var [a, b, c] = p;
	    var [x1, y1] = p[0].midpoint(p[1]);
	    var [x2, y2] = p[1].midpoint(p[2]);
	    if (a.y == b.y && b.y == c.y) return line(p, l)[0];
	    var m, x, y;
	    if (a.y == b.y) {
	        m = -(b.x - c.x) / (b.y - c.y);
	        x = x1;
	        y = m * (x - x2) + y2;
	    } else if (b.y == c.y) {
	        m = -(b.x - a.x) / (b.y - a.y);
	        x = x2;
	        y = m * (x - x1) + y1;
	    } else {
	        var m1 = -(b.x - a.x) / (b.y - a.y),
	            m2 = -(b.x - c.x) / (b.y - c.y);
	        if (m1 == m2) return Util.line(p, l)[0];
	        x = (m1 * x1 - m2 * x2 - y1 + y2) / (m1 - m2);
	        y = m1 * (x - x1) + y1;
	    }
	    var r = new Vector(x, y).distanceTo(a),
	        t = l / r,
	        t1 = Math.atan2(a.y - y, a.x - x),
	        dt = step * t / l,
	        d = ((b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x)) < 0 ? -1 : 1;
	    //if(p[0][0]==296 && p[1][0]==368) console.log(m1,m2,x1,y1,x2,y2);
	    p = [];
	    for (var i = 0; i < Math.floor(t / dt); i++) {
	        var j = i * d;
	        p.push([x + r * Math.cos(t1 + dt * j), y + r * Math.sin(t1 + dt * j)]);
	    }
	    p.push([x + r * Math.cos(t1 + t * d), y + r * Math.sin(t1 + t * d)]);
	    return p;
	}
	static render_curve2(p, cs) {
		var csi = cs;
		if (cs === undefined) cs = 72 * 2;
		var k = 2.5;
		cs *= 22 / 12;
		var x = [],
			y = [];
		for (var i = 0; i < p.length; i++) {
			x.push(p[i][0] * 2);
			y.push(p[i][1] * 2);
		}
		var minx = min(x),
			miny = min(y),
			maxx = max(x),
			maxy = max(y);
		var w = maxx - minx,
			h = maxy - miny;
		// for(var i = 0; i < y.length; i++){
		//   y[i] -= h;
		// }
		var overlay = new Canvas();
		overlay.width = Math.ceil(w + cs);
		overlay.height = Math.ceil(h + cs);
		var ctx = overlay.getContext('2d');
		var border = new Canvas();
		border.width = Math.ceil(w + cs);
		border.height = Math.ceil(h + cs);
		var ctx2 = border.getContext('2d');
		var body = new Canvas();
		body.width = Math.ceil(w + cs);
		body.height = Math.ceil(h + cs);
		var ctx3 = body.getContext('2d');
		var a = 0;
		ctx.beginPath();
		ctx2.beginPath();
		ctx3.beginPath();
		ctx.lineCap = ctx2.lineCap = 'round';
		ctx.lineJoin = ctx2.lineJoin = 'round';
		ctx2.lineCap = ctx2.lineCap = 'round';
		ctx2.lineJoin = ctx2.lineJoin = 'round';
		ctx3.lineCap = ctx2.lineCap = 'round';
		ctx3.lineJoin = ctx2.lineJoin = 'round';
		ctx.moveTo(x[0] - minx + cs / 2, y[0] - miny + cs / 2);
		ctx2.moveTo(x[0] - minx + cs / 2, y[0] - miny + cs / 2);
		ctx3.moveTo(x[0] - minx + cs / 2, y[0] - miny + cs / 2);
		for (i = 1; i < p.length; i++) {
			ctx.lineTo(x[i] - minx + cs / 2, y[i] - miny + cs / 2);
			ctx2.lineTo(x[i] - minx + cs / 2, y[i] - miny + cs / 2);
			ctx3.lineTo(x[i] - minx + cs / 2, y[i] - miny + cs / 2);
		}
		i = 0;
		while (a < cs / k) {
			ctx.lineWidth = ctx2.lineWidth = ctx3.lineWidth = cs - a * k;
			if (i === 0) {
				ctx2.strokeStyle = '#FFF';
				a += cs / 10 / k;
				ctx2.stroke();
			} else {
				var c = a / cs * k / 8;
				ctx.globalAlpha = c;
				ctx.strokeStyle = '#FFF';
				a += k;
				ctx.stroke();
				if (i == 1) {
					ctx3.fillStyle = '#FFF';
					ctx3.fillRect(0, 0, body.width, body.height);
					ctx3.globalCompositeOperation = 'destination-in';
					ctx3.stroke();
				}
				ctx.globalCompositeOperation = 'source-over';
			}
			i++;
		}
		ctx.globalCompositeOperation = 'copy';
		ctx.globalAlpha = 0.5;
		ctx.drawImage(overlay, 0, 0);
		return [
			[border, body, overlay],
			[minx / 2 - cs / 4, miny / 2 - cs / 4]
		];
	}
}

module.exports = Util;
