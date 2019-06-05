"use strict";

const LotteryGameQuotaCQRS = require("./LotteryGameQuotaCQRS")();
const LotteryGameQuotaES = require("./LotteryGameQuotaES")();

module.exports = {
  /**
   * @returns {LotteryGameQuotaCQRS}
   */
  LotteryGameQuotaCQRS,
  /**
   * @returns {LotteryGameQuotaES}
   */
  LotteryGameQuotaES
};
