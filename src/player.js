const constants = require("./constants");

class Player {
  constructor(beatmap, skin, replay, canvas) {
    this.beatmap = beatmap;
    this.skin = skin;
    this.replay = replay;
    this.canvas = canvas;

    this.ctx = canvas.getContext("2d");
  }
  render(timestamp) {
    let ctx = this.ctx;
    ctx.save();

    // draw the background image
    ctx.drawImage(this.beatmap.BackgroundImage, 0, 0, constants.FULL_WIDTH,
                  constants.FULL_HEIGHT);
    ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
    ctx.fillRect(0, 0, constants.FULL_WIDTH, constants.FULL_HEIGHT);

    // draw scorebar-bg

    ctx.restore();
  }
}

module.exports = Player;