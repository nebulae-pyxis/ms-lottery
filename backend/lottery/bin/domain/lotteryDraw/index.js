"use strict";

const Rx = require('rxjs');
const LotteryDrawCQRS = require("./LoterryDrawCQRS")();
const LotteryDrawES = require("./LoteryDrawES")();
const DataAccess = require("./data-access");

module.exports = {
  /**
   * domain start workflow
   */
  start$: DataAccess.start$ ,
  /**
   * @returns {LotteryDraw}
   */
  LotteryDrawCQRS,
  /**
   * @returns {LotteryDrawES}
   */
  LotteryDrawES,
};
