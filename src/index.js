const fs = require("fs");
const path = require("path");

const md5File = require("md5-file/promise");

const Beatmap = require("./beatmap");
const Replay = require("./replay");
const Skin = require("./skin");
const constants = require("./constants");
const utils = require("./utils");

process.on("unhandledRejection", (reason, promise) => { console.log(reason); });

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
      if (replay.beatmapHash === await(md5File(mapFolder + "/" + filename))) {
        mapFile = mapFolder + "/" + filename;
        break;
      }
    }
  }
  if (mapFile === null) {
    process.stderr.write("md5 hash didn't match any\n");
    process.exit(1);
  }
  let map = new Beatmap();
  map.parse(mapFile);

  // load skin
  let skin = new Skin();
  await skin.load();
  skin.options = await skin.parseIni();
};

module.exports = main;