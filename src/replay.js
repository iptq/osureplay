const packer = require("pypacker");

const constants = require("./constants");
const utils = require("./utils");
const Vector = require("./math/vector");

class Reader {
  constructor(data) {
    this.data = data;
    this.offset = 0;
  }
  readByte() {
    let d =
        new packer("<b").unpack(this.data.slice(this.offset, this.offset + 1));
    this.offset += 1;
    return d[0];
  }
  readULEB() {
    let val = 0;
    let i = 0;
    let c;
    while (((c = this.readByte()) & 0x80) == 0x80) {
      val = val | ((c & 0x7F) << (i++ * 7));
    }
    val = val | ((c & 0x7F) << (i++ * 7));
    return val;
  }
  readShort() {
    let d =
        new packer("<h").unpack(this.data.slice(this.offset, this.offset + 2));
    this.offset += 2;
    return d[0];
  }
  readInt() {
    let d =
        new packer("<I").unpack(this.data.slice(this.offset, this.offset + 4));
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

// copied from the osu!api wiki
// contains only the ones that apply to standard
// fuck minigames lol
const modmask = {
  None : 0,
  NoFail : 1,
  Easy : 2,
  NoVideo : 4,
  Hidden : 8,
  HardRock : 16,
  SuddenDeath : 32,
  DoubleTime : 64,
  Relax : 128,
  HalfTime : 256,
  Nightcore : 512,
  Flashlight : 1024,
  Autoplay : 2048,
  SpunOut : 4096,
  Relax2 : 8192,
  Perfect : 16384
};

class Replay {
  constructor() { this.cursorHistory = []; }
  async load(path) {
    let data = await utils.readFileAsync(path);
    let reader = new Reader(data);

    this.gameMode = reader.readByte();
    this.gameVersion = reader.readInt();
    reader.readByte(); // 0x0b
    let hashLength = reader.readULEB();
    this.beatmapHash = reader.readString(hashLength);
    reader.readByte(); // 0x0b
    let unameLength = reader.readULEB();
    this.playerName = reader.readString(unameLength);
    reader.readByte(); // 0x0b
    hashLength = reader.readULEB();
    this.replayHash = reader.readString(hashLength);
    this.hit300 = reader.readShort();
    this.hit100 = reader.readShort();
    this.hit50 = reader.readShort();
    this.gekis = reader.readShort();
    this.katus = reader.readShort();
    this.misses = reader.readShort();
    this.score = reader.readInt();
    this.maxCombo = reader.readShort();
    this.fc = reader.readByte() == 1;

    // mods
    this.mods = reader.readInt();
    this.modmap = {};
    for (let key in modmask)
      if (this.mods & modmask[key])
        this.modmap[key] = true;
    console.log(this.modmap);

    if (reader.readByte()) {
      let lifeBarLength = reader.readULEB();
      this.lifeBar = reader.readString(lifeBarLength);
    }
    // fuck timestamp
    reader.readInt();
    reader.readInt();
    this.replayLength = reader.readInt();
    let rawMovementData = reader.data.slice(reader.offset);
    // process cursor information
    let movementData = await utils.decompressLZMA(rawMovementData);
    if (!movementData) {
      process.stderr.write("Failed to parse movement data.\n");
      process.exit(1);
    }
    let parsedMovementData = movementData.split(",").map(function(line) {
      let parts = line.split("|");
      return {
        dt : parseInt(parts[0]),
        position : new Vector(parseFloat(parts[1]), parseFloat(parts[2])),
        keyBits : parseInt(parts[3])
      };
    });
    this.cursorPositions = parsedMovementData.slice(0);
    this.cursorPositions[0].time = this.cursorPositions[0].dt;
    for (let i = 1; i < parsedMovementData.length; ++i) {
      this.cursorPositions[i].time =
          parsedMovementData[i - 1].time + parsedMovementData[i].dt;
      this.cursorPositions[i].keys = {
        M1 : ((parsedMovementData[i].keyBits & 1) == 1) &&
                 ((parsedMovementData[i].keyBits & 5) != 5),
        M2 : ((parsedMovementData[i].keyBits & 2) == 2) &&
                 ((parsedMovementData[i].keyBits & 10) != 10),
        K1 : (parsedMovementData[i].keyBits & 5) == 5,
        K2 : (parsedMovementData[i].keyBits & 10) == 10
      };
    }
    this.lastCursor = 0;
    console.log("Replay has been loaded.");
  }
  getCursorAt(timestamp) {
    // assumes this function is being called sequentially
    while (this.cursorPositions[this.lastCursor].time <= timestamp) {
      this.lastCursor++;
    }
    let current = this.cursorPositions[this.lastCursor];
    this.cursorHistory.push(current.position);
    if (this.cursorHistory.length > constants.CURSOR_TRAIL_LENGTH)
      this.cursorHistory.shift();
    return current;
  }
}

module.exports = Replay;
