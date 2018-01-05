const packer = require("pypacker");

const utils = require("./utils");

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

class Replay {
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
    this.mods = reader.readInt();
    if (reader.readByte()) {
      let lifeBarLength = reader.readULEB();
      this.lifeBar = reader.readString(lifeBarLength);
    }
    // fuck timestamp
    reader.readInt();
    reader.readInt();
    let replayLength = reader.readInt();
    let rawMovementData = reader.data.slice(reader.offset);
    var movementData = await utils.decompressLZMA(rawMovementData);
    if (!movementData) {
      process.stderr.write("Failed to parse movement data.\n");
      process.exit(1);
    }
    this.movementData = movementData.split(",").map(function(line) {
      let parts = line.split("|");
      return {
        dt : parseInt(parts[0]),
        x : parseFloat(parts[1]),
        y : parseFloat(parts[2]),
        keyBits : parseInt(parts[3])
      };
    });
    console.log("Replay has been loaded.");
  }
}

module.exports = Replay;