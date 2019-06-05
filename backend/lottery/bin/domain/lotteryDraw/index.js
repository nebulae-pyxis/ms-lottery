"use strict";

const Rx = require('rxjs');
const LotteryDrawCQRS = require("./LoterryDrawCQRS")();
const LotteryDrawES = require("./LoteryDrawES")();
const LotteryDrawDA = require("./data-access/LotteryDrawDA");

module.exports = {
  /**
   * domain start workflow
   */
  start$: Rx.concat(LotteryDrawDA.start$()),
  /**
   * @returns {DriverCQRS}
   */
  LotteryDrawCQRS,
  /**
   * @returns {DriverES}
   */
  LotteryDrawES,
};
