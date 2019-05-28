"use strict";

const LotteryGamePrizeProgramCQRS = require("./LotteryGamePrizeProgramCQRS")();
const LotteryGamePrizeProgramES = require("./LotteryGamePrizeProgramES")();

module.exports = {
  /**
   * @returns {LotteryGamePrizeProgramCQRS}
   */
  LotteryGamePrizeProgramCQRS,
  /**
   * @returns {LotteryGamePrizeProgramES}
   */
  LotteryGamePrizeProgramES
};
