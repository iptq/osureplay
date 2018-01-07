const fs = require("fs");

const Canvas = require("canvas"), Image = Canvas.Image;
const lzma = require("lzma");
const unzip = require("unzip");

let decompressLZMA = async function(data) {
  return new Promise(function(resolve) {
    lzma.decompress(data, function(result, err) { resolve(result); })
  });
};

let extract = function(zip, folder) {
  return new Promise(function(resolve) {
    fs.createReadStream(zip)
        .pipe(unzip.Extract({path : folder}))
        .on("close", function() { resolve(); });
    console.log("Extraction complete.");
  });
};

let randomString = function(length) {
  length = length || 12;
  let alphabet = "abcdefghijklmnopqrstuvwxyz";
  alphabet += alphabet.toUpperCase();
  let string = "";
  for (let i = 0; i < length; i += 1) {
    let index = ~~(Math.random() * alphabet.length);
    string += alphabet.charAt(index);
  }
  return string;
};

let readFileAsync = function(filename) {
  return new Promise(function(resolve, reject) {
    fs.readFile(filename, function(err, data) {
      if (err)
        return reject(err);
      resolve(data);
    });
  });
};

let record = function(canvas, recorder) {
  return new Promise(function(resolve) {
    let stream = canvas.jpegStream({
      bufsize : 4096,    // output buffer size in bytes, default: 4096
      quality : 75,      // JPEG quality (0-100) default: 75
      progressive : true // true for progressive compression, default: false
    });
    stream.on("data", function(chunk) { recorder.stdin.write(chunk); });
    stream.on("end", function() { resolve(); });
  });
};

// key required for caching btw
let tintCache = {};
let tint = function(keyPrefix, image, color) {
  let key = `${keyPrefix}:${color.red},${color.green},${color.blue}`;
  if (!(key in tintCache)) {
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
      rgba[px + 1] *= color.green / 255;
      rgba[px + 2] *= color.blue / 255;
    }
    ctx.putImageData(imgdata, 0, 0);
    tintCache[key] = canvas;
  }
  return tintCache[key];
};

module.exports.decompressLZMA = decompressLZMA;
module.exports.extract = extract;
module.exports.randomString = randomString;
module.exports.readFileAsync = readFileAsync;
module.exports.record = record;
module.exports.tint = tint;