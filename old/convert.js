#!/usr/bin / env node

/**
 * TODO:
 * stacking lol
 */

const Canvas = require("canvas"), Image = Canvas.Image;
const async = require("asyncawait/async");
const await = require("asyncawait/await");
const bluebird = require("bluebird");
const fs = bluebird.promisifyAll(require("fs"));
const child_process = require("child_process");
const unzip = require("unzip");
const packer = require("pypacker");
const lzma = require("lzma");
const md5File = bluebird.promisify(require("md5-file"));
const osuParser = bluebird.promisifyAll(require("osu-parser"));

const FPS = 60; // todo adjust
const CURSOR_SIZE = 40;
const WIDTH = 1920;
const HEIGHT = 1080;
const SWIDTH = 1024;
const SHEIGHT = 768;

const Beatmap = require("./lib/Beatmap");
const HitObject = require("./lib/beatmap/HitObject");
const Logger = require("./lib/Logger");
const Skin = require("./lib/Skin");
const Util = require("./lib/Util");
const Vector = require("./lib/Vector");

if (process.argv.length < 5) {
  console.log(`Usage: ${process.argv[1]} [osr] [osz] [mp4 out]`);
  process.exit(0);
}

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

let decompress = function(data) {
  return new Promise(function(resolve) {
    lzma.decompress(data, function(result, err) { resolve(result); })
  });
};

let extract = function(zip, folder) {
  return new Promise(function(resolve) {
    fs.createReadStream(zip)
        .pipe(unzip.Extract({path : folder}))
        .on("close", function() { resolve(); });
  });
};

let saveCanvas = function(canvas, outFile) {
  return new Promise(function(resolve) {
    let stream = canvas.pngStream();
    let out = fs.createWriteStream(outFile);
    stream.on("chunk", function() { out.write(chunk); });
    stream.on("end", function() { resolve(); });
  });
};

let pad =
    function(num, size) {
  var s = num + "";
  while (s.length < size)
    s = "0" + s;
  return s;
}

let readReplay = async(function(replayData) {
  class Reader {
    constructor(data) {
      this.data = data;
      this.offset = 0;
    }
    readByte() {
      let d = new packer("<b").unpack(
          this.data.slice(this.offset, this.offset + 1));
      this.offset += 1;
      return d[0];
    }
    readULEB() {
      var val = 0;
      var i = 0;
      var c;
      while (((c = this.readByte()) & 0x80) == 0x80) {
        val = val | ((c & 0x7F) << (i++ * 7));
      }
      val = val | ((c & 0x7F) << (i++ * 7));
      return val;
    }
    readShort() {
      let d = new packer("<h").unpack(
          this.data.slice(this.offset, this.offset + 2));
      this.offset += 2;
      return d[0];
    }
    readInt() {
      let d = new packer("<I").unpack(
          this.data.slice(this.offset, this.offset + 4));
      this.offset += 4;
      return d[0];
    }
    readString(length) {
      let d =
          this.data.slice(this.offset, this.offset + length).toString("utf-8");
      this.offset += length;
      return d;
    }
  }
  let reader = new Reader(replayData);
  let replay = {};
  replay.gameMode = reader.readByte();
  replay.gameVersion = reader.readInt();
  reader.readByte(); // 0x0b
  let hashLength = reader.readULEB();
  replay.beatmapHash = reader.readString(hashLength);
  reader.readByte(); // 0x0b
  let unameLength = reader.readULEB();
  replay.playerName = reader.readString(unameLength);
  reader.readByte(); // 0x0b
  hashLength = reader.readULEB();
  replay.replayHash = reader.readString(hashLength);
  replay.hit300 = reader.readShort();
  replay.hit100 = reader.readShort();
  replay.hit50 = reader.readShort();
  replay.gekis = reader.readShort();
  replay.katus = reader.readShort();
  replay.misses = reader.readShort();
  replay.score = reader.readInt();
  replay.maxCombo = reader.readShort();
  replay.fc = reader.readByte() == 1;
  replay.mods = reader.readInt();
  if (reader.readByte()) {
    let lifeBarLength = reader.readULEB();
    replay.lifeBar = reader.readString(lifeBarLength);
  }
  // fuck timestamp
  reader.readInt();
  reader.readInt();
  let replayLength = reader.readInt();
  let rawMovementData = reader.data.slice(reader.offset);
  var movementData = await(decompress(rawMovementData));
  if (!movementData) {
    process.stderr.write("Failed to parse movement data.\n");
    process.exit(1);
  }
  replay.movementData = movementData.split(",").map(function(line) {
    let parts = line.split("|");
    return {
      dt : parseInt(parts[0]),
      x : parseFloat(parts[1]),
      y : parseFloat(parts[2]),
      keyBits : parseInt(parts[3])
    };
  });
  // console.log(replay);
  return replay;
});

let writeFrame = function(canvas, recorder) {
  return new Promise(function(resolve) {
    let stream = canvas.jpegStream({
      bufsize : 4096 // output buffer size in bytes, default: 4096
      ,
      quality : 75 // JPEG quality (0-100) default: 75
      ,
      progressive : false // true for progressive compression, default: false
    });
    stream.on("data", function(chunk) { recorder.stdin.write(chunk); });
    stream.on("end", function() { resolve(); });
  });
};

let AR_time = function(n) {
  return parseFloat(
      (1.2 - (n >= 5 ? (n - 5) * 0.15 : (n - 5) * 0.12)).toFixed(4));
};

let CS_px = function(n) { return 88 - 8 * (n - 2); };

let hasM1 = (n) => { return ((n & 1) == 1) && ((n & 5) != 5); };
let hasM2 = (n) => { return ((n & 2) == 2) && ((n & 10) != 10); };
let hasK1 = (n) => { return ((n & 5) == 5); };
let hasK2 = (n) => { return ((n & 10) == 10); };

let getKey = function(last, current) {
  let result = 0;
  if (!hasM1(last) && hasM1(current) && !hasK1(current))
    result |= 1;
  if (!hasM2(last) && hasM2(current) && !hasK2(current))
    result |= 2;
  if (!hasK1(last) && hasK1(current))
    result |= 5;
  if (!hasK2(last) && hasK2(current))
    result |= 10;
  return result;
};

let judgeHit = function(od, hit) {
  let window300 = 79 - (od * 6) + 0.5;
  let window100 = 139 - (od * 8) + 0.5;
  let window50 = 199 - (od * 10) + 0.5;
  let dt = Math.abs(hit.frame.time - hit.note.startTime);
  let points = 0;
  if (dt < window300) {
    points = 300;
  } else if (dt < window100) {
    points = 100;
  } else if (dt < window50) {
    points = 50;
  }
  return points;
};

let start = async(function() {
  let logger = new Logger(process.env.VERBOSE);
  try { // create working directory
    await(fs.mkdirAsync("wd"));
  } catch (e) { /* whatever lol */
  }

  let replayPath = await(fs.realpathAsync(process.argv[2]));
  let mapPath = await(fs.realpathAsync(process.argv[3]));
  let outputFile = process.argv[4];
  if (!await(fs.statAsync(replayPath)))
    throw new Error("can't find replay");
  if (!await(fs.statAsync(mapPath)))
    throw new Error("can't find map");

  let folderName;
  while (true) {
    folderName = "wd/" + randomString();
    try {
      await(fs.mkdirAsync(folderName));
      break;
    } catch (e) {
    }
  }
  folderName = await(fs.realpathAsync(folderName));
  console.log("working directory:", folderName);

  await(Skin.loadImages());
  Skin.options = await(Skin.ParseIni('cookie'));

  let replayData = await(fs.readFileAsync(process.argv[2]));
  let replay = await(readReplay(replayData));
  // console.log(replay);

  let mapFolder = folderName + "/map";
  try {
    await(fs.mkdirAsync(mapFolder));
  } catch (e) {
  }

  // extract map
  await(extract(mapPath, mapFolder));

  let files = await(fs.readdirAsync(mapFolder));
  let mapFile = null;
  for (let filename of files) {
    if (filename.endsWith(".osu")) {
      if (replay.beatmapHash === await(md5File(mapFolder + "/" + filename))) {
        mapFile = mapFolder + "/" + filename;
        break;
      }
    }
  }

  if (mapFile === null) {
    process.stderr.write("fuck off\n");
    process.exit(1);
  }
  let map = await(Beatmap.ParseFile(mapFile));
  // let parsedMap = await(osuParser.parseFileAsync(mapFile));

  let getMp3Duration = function() {
    return new Promise(resolve => {
      require('mp3-duration')(mapFolder + "/" + map.AudioFilename,
                              (err, response) => resolve(response));
    });
  };
  let mp3duration = await(getMp3Duration());
  console.log("Audio Length: " + mp3duration);
  let frameCount = Math.ceil(mp3duration * FPS);

  let backgroundImage = new Image();
  backgroundImage.src =
      await(fs.readFileAsync(mapFolder + "/" + map.bgFilename));

  let sec;
  let canvas = new Canvas(WIDTH, HEIGHT);
  let ctx = canvas.getContext("2d");
  let recorder = child_process.spawn("ffmpeg", [
    "-y", "-f", "image2pipe", "-vcodec", "mjpeg", "-r", "60", "-i", "-",
    "-vcodec", "h264", "-r", "60", folderName + "/noaudio.mp4"
  ]);
  // recorder.stdout.on("data", function(e) {
  // 	var output = "";
  // 	for (var i = 0; i < e.length; i++) {
  // 		output += String.fromCharCode(e[i]);
  // 	};
  // 	console.log(output);
  // });
  // recorder.stderr.on("data", function(e) {
  // 	var output = "";
  // 	for (var i = 0; i < e.length; i++) {
  // 		output += String.fromCharCode(e[i]);
  // 	};
  // 	console.error(output);
  // });
  let mouseMovements = replay.movementData.slice(0);
  let mx = 0, my = 0;
  mouseMovements[0].time = mouseMovements[0].dt;
  for (let i = 1; i < mouseMovements.length; ++i) {
    mouseMovements[i].time = mouseMovements[i - 1].time + mouseMovements[i].dt;
    mouseMovements[i].keys = {
      M1 : ((mouseMovements[i].keyBits & 1) == 1) &&
               ((mouseMovements[i].keyBits & 5) != 5),
      M2 : ((mouseMovements[i].keyBits & 2) == 2) &&
               ((mouseMovements[i].keyBits & 10) != 10),
      K1 : (mouseMovements[i].keyBits & 5) == 5,
      K2 : (mouseMovements[i].keyBits & 10) == 10
    };
  }
  // let unslicedMovementData = mouseMovements.slice(0);

  let difficultyPoints =
      map.CircleSize + map.HPDrainRate + map.OverallDifficulty;
  var difficultyPointMultiplier;
  if (difficultyPoints < 0) {
    // something is fucked
    process.exit(69);
  } else if (difficultyPoints <= 5) {
    difficultyPointMultiplier = 2;
  } else if (difficultyPoints <= 12) {
    difficultyPointMultiplier = 3;
  } else if (difficultyPoints <= 17) {
    difficultyPointMultiplier = 4;
  } else if (difficultyPoints <= 24) {
    difficultyPointMultiplier = 5;
  } else if (difficultyPoints <= 30) {
    difficultyPointMultiplier = 6;
  }

  // MODS
  console.log("MODS:", replay.mods);
  let modMultiplier = 1;
  if ((replay.mods >> 4) & 1) {
    console.log("HR is on.");
    modMultiplier *= 1.06;
    map.ApproachRate = Math.min(10, map.ApproachRate * 1.4);
    map.HPDrainRate = Math.min(10, map.HPDrainRate * 1.4);
    map.OverallDifficulty = Math.min(10, map.OverallDifficulty * 1.4);
    map.CircleSize = Math.min(10, map.CircleSize * 1.3);
    for (var i = 0; i < map.HitObjects.length; ++i) {
      map.HitObjects[i].flip();
    }
  } else if (replay.mods & 1) {
    modMultiplier *= 0.50;
  }
  //

  let AR = AR_time(map.ApproachRate);
  let CS = CS_px(map.CircleSize);

  let prevMousePositions = [];
  let objCounter = 0;

  for (let color of map.ComboColors) {
    for (let texture of["hitcircle", "approachcircle", "sliderb0"]) {
      Skin.addImage(`${texture}-${color.hex()}`,
                    color.tint(Skin.resources[texture]));
    }
  }
  for (let n = 10; n <= map.maxCombo; n++) {
    let digits = [];
    let n2 = n.toString();
    for (let i = 0; i < n2.length; i++) {
      digits.push(Skin.resources['default-' + n2.charAt(i)]);
    }
    Skin.addImage(
        `default-${n}`,
        Util.concatImages(digits,
                          parseInt(Skin.options.HitCircleOverlap || 2, 10)));
  }

  // associate hits
  console.log("Calculating hits...");
  let keyIndex = 0;
  const hitTimeWindow = -12 * map.OverallDifficulty + 259.5;
  console.log("hitTimeWindow", hitTimeWindow);
  let obtainedPoints = 0, totalPoints = 0;
  let hits = [];
  // for (let i = map.HitObjects.length - 1; i >= 0; --i) {
  for (let i = 0; i < map.HitObjects.length; ++i) {
    let note = map.HitObjects[i];
    let noteHitFlag = false;
    if (note instanceof HitObject.Spinner)
      continue;
    if (note instanceof HitObject.Slider)
      continue; /// doing hitcircles first
    for (let j = keyIndex; j < mouseMovements.length; ++j) {
      // for (let j = mouseMovements.length - 1; j >= keyIndex; --j) {
      let frame = mouseMovements[j];
      let lastKey = j > 0 ? mouseMovements[j - 1].keyBits : 0;
      let pressedKey = getKey(lastKey, frame.keyBits);
      if (frame.time - note.startTime > hitTimeWindow)
        break;
      // if (pressedKey > 0 && Math.abs(frame.time - note.startTime) <=
      // hitTimeWindow) {
      // 	console.log("hit", note.position, frame.x, frame.y);
      // }
      if (pressedKey > 0 &&
          Math.abs(frame.time - note.startTime) <= hitTimeWindow) {
        if (note.containsPoint(new Vector(frame.x, frame.y), map.CircleSize)) {
          noteHitFlag = true;
          let hit = {
            type : "hit",
            note : note,
            frame : frame,
            pressedKey : pressedKey
          };
          map.HitObjects[i].hit = hit;
          let judgment = judgeHit(map.OverallDifficulty, hit);
          hit.judgment = judgment;
          obtainedPoints += judgment;
          totalPoints += 300;
          hits.push(hit);
          keyIndex = j + 1;
          break;
        }
      }
    }
    if (!noteHitFlag) {
      hits.push({type : "miss", note : note});
    }
    // console.log("Hit object #" + i);
  }
  // console.log(map.HitObjects.length);
  console.log("Accuracy: " +
              Math.round(10000 * obtainedPoints / totalPoints) / 100.0 + "%");
  console.log(hits.filter((x) => x.type == "hit").length);

  let gridcanvas2 = new Canvas();
  let ctx2 = gridcanvas2.getContext("2d");
  gridcanvas2.width = canvas.width;
  gridcanvas2.height = canvas.height;
  let score = 0;
  // console.log([map]);

  let screenAdditions =
      []; // things like score or misses or even fancy stars and stuff

  let objIndex = 0, hitIndex = 0;
  let combo = 0;

  let count300 = 0, count100 = 0, count50 = 0, countMiss = 0;

  // let END = frameCount;
  let END = 800;
  for (let i = 0; i < END; ++i) {
    try {
      let msec = i * 1000 / 60.0;
      ctx.clearRect(0, 0, WIDTH, HEIGHT);
      ctx2.clearRect(0, 0, WIDTH, HEIGHT);
      ctx.drawImage(backgroundImage, 0, 0, WIDTH, HEIGHT);
      ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
      ctx.fillRect(0, 0, WIDTH, HEIGHT);

      // grid
      ctx.save();
      const gridsize = 16;
      ctx.strokeStyle = "rgba(255, 255, 255, 0.15)";
      var sx, sx0, sx1, sy, sy0, sy1;
      for (let x = 0; x <= 512; x += gridsize) {
        [sx, sy0] = Util.toScreenCoords(x, 0);
        [sx, sy1] = Util.toScreenCoords(x, 384);
        ctx.beginPath();
        ctx.moveTo(sx, sy0);
        ctx.lineTo(sx, sy1);
        ctx.stroke();
      }
      for (let y = 0; y <= 384; y += gridsize) {
        [sx0, sy] = Util.toScreenCoords(0, y);
        [sx1, sy] = Util.toScreenCoords(512, y);
        ctx.beginPath();
        ctx.moveTo(sx0, sy);
        ctx.lineTo(sx1, sy);
        ctx.stroke();
      }
      ctx.restore();
      // end grid

      for (let j = objIndex; j < map.HitObjects.length; ++j) {
        // if (j > 1) break;
        let obj = map.HitObjects[j];
        let dt = (obj.startTime - msec) / 1000.0;
        obj.render(ctx, ctx2, msec, AR, CS, map.OverallDifficulty);
        if (obj.hit && !obj.counted) {
          if (obj.hit.frame.time < msec) {
            obj.counted = true;
            switch (obj.hit.judgment) {
            case 300:
              count300++;
              break;
            case 100:
              count100++;
              break;
            case 50:
              count50++;
              break;
            }
            // console.log(obj.hit.judgment);
            score +=
                obj.hit.judgment +
                (obj.hit.judgment *
                 ((combo * difficultyPointMultiplier * modMultiplier) / 25));
            combo += 1;
          }
        } else if (!obj.hit) {
          countMiss++;
          break;
          combo = 0;
        }
        if (obj.startTime < msec - hitTimeWindow) {
          objIndex = j;
        } else if (obj.startTime > msec + hitTimeWindow) {
          break;
        }
      }
      ctx.drawImage(gridcanvas2, 0, 0);

      // draw score
      let scoreString = score.toString().pad(8);
      // console.log(scoreString);
      ctx.font = "60px Arial";
      ctx.fillStyle = "#ffffff";
      ctx.fillText(scoreString, 1900 - ctx.measureText(scoreString).width, 50);

      let comboString = combo.toString() + "x";
      ctx.fillText(comboString, 50, 1000);

      while (mouseMovements[0].time <= msec) {
        mx = mouseMovements[0].x;
        my = mouseMovements[0].y;
        mouseMovements = mouseMovements.slice(1);
      }

      // draw key overlay
      ctx.fillStyle = mouseMovements[0].keys.K1 ? "#ff0" : "#fff";
      ctx.fillRect(1880, 430, 40, 40);
      ctx.fillStyle = mouseMovements[0].keys.K2 ? "#ff0" : "#fff";
      ctx.fillRect(1880, 490, 40, 40);
      ctx.fillStyle = mouseMovements[0].keys.M1 ? "#f0f" : "#fff";
      ctx.fillRect(1880, 550, 40, 40);
      ctx.fillStyle = mouseMovements[0].keys.M2 ? "#f0f" : "#fff";
      ctx.fillRect(1880, 610, 40, 40);

      for (let i in prevMousePositions) {
        if (!parseInt(i))
          continue;
        ctx.globalAlpha = (i / prevMousePositions.length);
        let [px, py] = prevMousePositions[i];
        [sx, sy] = Util.toScreenCoords(px, py);
        ctx.drawImage(Skin.resources["cursortrail"], sx - CURSOR_SIZE / 2,
                      sy - CURSOR_SIZE / 2, CURSOR_SIZE, CURSOR_SIZE);
      }
      ctx.globalAlpha = 1;
      [sx, sy] = Util.toScreenCoords(mx, my);
      ctx.drawImage(Skin.resources["cursor"], sx - CURSOR_SIZE / 2,
                    sy - CURSOR_SIZE / 2, CURSOR_SIZE, CURSOR_SIZE);
      prevMousePositions.push([ mx, my ]);
      if (prevMousePositions.length > 8) {
        prevMousePositions =
            prevMousePositions.slice(prevMousePositions.length - 6);
      }

      await(writeFrame(canvas, recorder));
      let s1 = "\rProcessing " +
               (Math.round((i + 1) * 10000.00 / END) / 100.0) + "%";
      process.stdout.write(s1 + Array(40 - s1.length).join(" "));
    } catch (e) {
      console.log("Frame " + i + " fucked up.");
      throw e;
    }
  }
  console.log();
  console.log("Final score:", score, combo);
  console.log(count300, count100, count50, countMiss);

  recorder.stdin.end();
  recorder.on("close", function() {
    // mix audio
    var mixer = child_process.spawn("ffmpeg", [
      "-y", "-i", folderName + "/noaudio.mp4", "-itsoffset", "00:00:" + "00",
      "-i", mapFolder + "/" + map.AudioFilename, "-vcodec", "copy", "-acodec",
      "libmp3lame", "-shortest", outputFile
    ]);
    // mixer.stdout.on("data", function(e) {
    // 	var output = "";
    // 	for (var i = 0; i < e.length; i++) {
    // 		output += String.fromCharCode(e[i]);
    // 	};
    // 	console.log(output);
    // });
    // mixer.stderr.on("data", function(e) {
    // 	var output = "";
    // 	for (var i = 0; i < e.length; i++) {
    // 		output += String.fromCharCode(e[i]);
    // 	};
    // 	console.error(output);
    // });
    mixer.stderr.on("data", function(data) { process.stdout.write(data); });
    mixer.on("close", function() { console.log("Done"); });
  });
});

start();