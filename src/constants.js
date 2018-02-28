module.exports = (function() {
  let constants = {
    WORKING_DIR : "working-directory",
    SKIN_DIR :    "skin/cookie2",

    FULL_WIDTH :    1366,
    FULL_HEIGHT :   768,
    ACTUAL_HEIGHT : 672,
    FPS :           45,

    CURSOR_SIZE :         40,
    CURSOR_TRAIL_LENGTH : 12,

    CIRCLE_FADE_OUT_TIME : 268,

    bezierTolerance : 0.25
  };
  constants.ACTUAL_WIDTH = Math.floor(constants.ACTUAL_HEIGHT * 512.0 / 384);
  return constants;
})();
