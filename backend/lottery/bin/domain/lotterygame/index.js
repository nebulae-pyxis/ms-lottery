"use strict";

const LotteryGameCQRS = require("./LotteryGameCQRS")();
const LotteryGameES = require("./LotteryGameES")();

module.exports = {
  /**
   * @returns {LotteryGameCQRS}
   */
  LotteryGameCQRS,
  /**
   * @returns {LotteryGameES}
   */
  LotteryGameES
};
