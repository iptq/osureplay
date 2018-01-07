const Canvas = require("canvas");

class Color {
  static hex(red, green, blue) {
    red = Math.floor(Math.min(red, 255));
    green = Math.floor(Math.min(green, 255));
    blue = Math.floor(Math.min(blue, 255));

    var redH = red.toString(16), greenH = green.toString(16),
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
  hex() { return Color.hex(this.red, this.green, this.blue); }
  clone() { return new Color(this.red, this.green, this.blue); }

  toArray() { return [ this.red, this.green, this.blue ]; }
  tint(image) {
    let color = this;
    if (color === undefined)
      return image;
    var canvas = new Canvas();
    canvas.height = image.height;
    canvas.width = image.width;
    var ctx = canvas.getContext("2d");
    ctx.drawImage(image, 0, 0);
    var w = image.width, h = image.height;
    if (!w || !h)
      return image;
    var imgdata = ctx.getImageData(0, 0, w, h);
    var rgba = imgdata.data;
    for (var px = 0, ct = w * h * 4; px < ct; px += 4) {
      rgba[px] *= color.red / 255;
      rgba[px + 1] *= color.blue / 255;
      rgba[px + 2] *= color.green / 255;
    }
    ctx.putImageData(imgdata, 0, 0);
    return canvas;
  }
}

module.exports = Color;
