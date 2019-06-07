"use strict";

const Rx = require("rxjs");
const LotteryDrawDA = require("./LotteryDrawDA");
const LotteryCalendarDA = require("./LotteryCalendarDA");

module.exports = {
  /**
   * domain start workflow
   */
  start$: Rx.concat(LotteryDrawDA.start$(), LotteryCalendarDA.start$()),
  /**
   * @returns {LotteryDrawDA}
   */
  LotteryDrawDA,
  /**
   * @returns {LotteryCalendarDA}
   */
  LotteryCalendarDA
};
