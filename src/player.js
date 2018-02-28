const Vector = require("./math/vector");
const constants = require("./constants");

class Player {
  constructor(beatmap, skin, replay, canvas) {
    this.beatmap = beatmap;
    this.skin = skin;
    this.replay = replay;
    this.canvas = canvas;

    this.ctx = canvas.getContext("2d");
    this.objIndex = 0; // the first hitobject that hasn't faded completely
    // out of existence
  }
  render(timestamp) {
    let ctx = this.ctx;
    ctx.save();

    // draw the background image
    // we want it to cover the whole screen so that means scaling it
    // normally this would be a clusterfuck of if statements
    // i'm assuming width > height here..
    // TODO: actually calculate this
    let imgRatio = this.beatmap.BackgroundImage.width /
                       this.beatmap.BackgroundImage.height;
    let newWidth = constants.FULL_HEIGHT * imgRatio;
    ctx.save();
    ctx.drawImage(this.beatmap.BackgroundImage,
      (constants.FULL_WIDTH - newWidth) / 2, 0, newWidth,
      constants.FULL_HEIGHT);
    ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
    ctx.fillRect(0, 0, constants.FULL_WIDTH, constants.FULL_HEIGHT);
    ctx.restore();

    // DEBUG: draw actual playfield!!
    ctx.save();
    let topLeft = (new Vector(0, 0)).o2r();
    let bottomRight = (new Vector(512, 384)).o2r();
    ctx.strokeStyle = "red";
    ctx.strokeText("PLAYFIELD", topLeft.x, topLeft.y);
    ctx.strokeRect(topLeft.x, topLeft.y, bottomRight.x - topLeft.x,
      bottomRight.y - topLeft.y);
    ctx.restore();

    // draw hit objects!
    for (let i = this.beatmap.HitObjects.length - 1; i >= this.objIndex; --i) {
      let obj = this.beatmap.HitObjects[i];
      if (obj.startTime > timestamp + this.beatmap.ReactionTime)
        continue;
      obj.render(this, timestamp);
      if (obj.startTime < timestamp - this.beatmap.Hit50)
        break;
    }

    // draw cursor
    let cursor = this.replay.getCursorAt(timestamp);
    for (let i = 0; i < this.replay.cursorHistory.length; ++i) {
      ctx.save();
      ctx.globalAlpha = i / this.replay.cursorHistory.length;

      let current = this.replay.cursorHistory[i].o2r();
      ctx.drawImage(this.skin.resources["cursortrail"],
        current.x - constants.CURSOR_SIZE / 2,
        current.y - constants.CURSOR_SIZE / 2,
        constants.CURSOR_SIZE, constants.CURSOR_SIZE);
      ctx.restore();
    }
    ctx.save();
    let realCursorPosition = cursor.position.o2r();
    ctx.drawImage(this.skin.resources["cursor"],
      realCursorPosition.x - constants.CURSOR_SIZE / 2,
      realCursorPosition.y - constants.CURSOR_SIZE / 2,
      constants.CURSOR_SIZE, constants.CURSOR_SIZE);
    ctx.restore();

    ctx.restore();
  }
}

module.exports = Player;
