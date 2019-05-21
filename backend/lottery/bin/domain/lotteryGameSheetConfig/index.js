"use strict";

const LotteryGameSheetConfigCQRS = require("./LotteryGameSheetConfigCQRS")();
const LotteryGameSheetConfigES = require("./LotteryGameSheetConfigES")();

module.exports = {
  /**
   * @returns {LotteryGameSheetConfigCQRS}
   */
  LotteryGameSheetConfigCQRS,
  /**
   * @returns {LotteryGameSheetConfigES}
   */
  LotteryGameSheetConfigES
};
