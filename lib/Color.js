class Color {
	static hex(red, green, blue) {
		red = Math.floor(Math.min(red, 255));
		green = Math.floor(Math.min(green, 255));
		blue = Math.floor(Math.min(blue, 255));

		var redH = red.toString(16),
			greenH = green.toString(16),
			blueH = blue.toString(16);

		return redH.pad(2) + greenH.pad(2) + blueH.pad(2);
	}
	static fromArray(colors) {
		return new Color(colors[0], colors[1], colors[2]);
	}
	constructor(_red, _green, _blue) {
		this.red = parseFloat(_red);
		this.green = parseFloat(_green);
		this.blue = parseFloat(_blue);
	}
	hex() {
		return Color.hex(this.red, this.green, this.blue);
	}

	toArray() {
		return [this.red, this.green, this.blue];
	}
}

module.exports = Color;
