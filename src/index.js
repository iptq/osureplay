const child_process = require("child_process");
const fs = require("fs");
const path = require("path");

const Canvas = require("canvas"), Image = Canvas.Image;
const md5File = require("md5-file/promise");
const mp3Duration = require("mp3-duration");

const Beatmap = require("./beatmap");
const Player = require("./player");
const Replay = require("./replay");
const Skin = require("./skin");
const constants = require("./constants");
const utils = require("./utils");

process.on("unhandledRejection", (reason, _promise) => { console.log(reason); });

let main = async function() {
  //
  // setup environment
  //

  if (process.argv.length < 5) {
    console.error(`Usage: ${process.argv[1]} [osr] [osz] [mp4 out]`);
    process.exit(0);
  }

  try { // create working directory
    await(fs.mkdirSync(constants.WORKING_DIR));
  } catch (e) {
  }

  let replayPath = fs.realpathSync(process.argv[2]);
  let mapPath = fs.realpathSync(process.argv[3]);
  let outputFile = process.argv[4];

  // make sure these files exist
  if (!fs.statSync(replayPath))
    throw new Error("can't find replay");
  if (!fs.statSync(mapPath))
    throw new Error("can't find map");

  let folderName;
  while (true) {
    folderName = path.join(constants.WORKING_DIR, utils.randomString());
    try {
      fs.mkdirSync(folderName);
      break;
    } catch (e) {
    }
  }
  folderName = fs.realpathSync(folderName);
  console.log("working directory:", folderName);

  let mapFolder = path.join(folderName, "map");
  try {
    await(fs.mkdirAsync(mapFolder));
  } catch (e) {
  }

  //
  // load replay/map/skin
  //

  // parse replay
  let replay = new Replay();
  replay.load(replayPath);

  // extract map
  await utils.extract(mapPath, mapFolder);

  let files = fs.readdirSync(mapFolder);
  let mapFile = null;
  for (let filename of files) {
    if (filename.endsWith(".osu")) {
      if (replay.beatmapHash ===
                await(md5File(mapFolder + "/" + filename))) {
        mapFile = mapFolder + "/" + filename;
        break;
      }
    }
  }
  if (mapFile === null) {
    process.stderr.write("md5 hash didn't match any\n");
    process.exit(1);
  }
  let beatmap = await Beatmap.parse(mapFile);
  beatmap.adjustForMods(replay.modmap);
  beatmap.calculateDifficultyProperties();
  beatmap.updateStacking();

  beatmap.BackgroundImage = new Image();
  beatmap.BackgroundImage.src =
        await utils.readFileAsync(path.join(mapFolder, beatmap.bgFilename));

  this.mp3duration =
        await mp3Duration(path.join(mapFolder, beatmap.AudioFilename));
  console.log("Audio Length: " + this.mp3duration);
  this.frameCount = Math.ceil(this.mp3duration * constants.FPS);

  // load skin
  let skin = new Skin(constants.SKIN_DIR);
  await skin.load();
  skin.options = await skin.parseINI();

  // prepare canvas
  let canvas = new Canvas(constants.FULL_WIDTH, constants.FULL_HEIGHT);
  let player = new Player(beatmap, skin, replay, canvas);
  // recorder
  let recorder = child_process.spawn("ffmpeg", [
    "-y", "-f", "image2pipe", "-vcodec", "mjpeg", "-r",
    constants.FPS.toString(), "-i", "-", "-vcodec", "h264", "-r",
    constants.FPS.toString(), path.join(folderName, "noaudio.mp4")
  ]);

  //
  // process frames
  //
  let END = 700;
  // let END = this.frameCount;
  console.log(`beginning rendering (${this.frameCount} frames)...`);
  process.stdout.write("\rProcessing 0%");
  for (let frame = 0; frame < END; ++frame) {
    try {
      let msec = frame * 1000.0 / constants.FPS;
      player.render(msec);

      await utils.record(player.canvas, recorder);
      if (true) { //(frame + 1) % (END / 100) == 0) {
        let percent = Math.round((frame + 1) * 10000.00 / END) / 100.0;
        let s1 = "\rProcessing " + percent + "%";
        process.stdout.write(s1 + Array(40 - s1.length).join(" "));
      }
    } catch (e) {
      console.error(e);
    }
  }
  console.log();

  recorder.stdin.end();
  recorder.on("close", function() {
    // mix audio
    var mixer = child_process.spawn("ffmpeg", [
      "-y", "-i", path.join(folderName, "noaudio.mp4"), "-itsoffset",
      "00:00:" +
                "00",
      "-i", path.join(mapFolder, beatmap.AudioFilename), "-vcodec",
      "copy", "-acodec", "libmp3lame", "-shortest", outputFile
    ]);

    mixer.stderr.on("data", function(data) { process.stdout.write(data); });
    mixer.on("close", function() { console.log("Done"); });
  });
};

module.exports = main;
