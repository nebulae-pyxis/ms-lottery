"use strict";

const LotteryCQRS = require("./LotteryCQRS")();
const LotteryES = require("./LotteryES")();

module.exports = {
  /**
   * @returns {LotteryCQRS}
   */
  LotteryCQRS,
  /**
   * @returns {LotteryES}
   */
  LotteryES
};
