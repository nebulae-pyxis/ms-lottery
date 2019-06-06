"use strict";

const Rx = require("rxjs");
const LotteryCalendarDA = require("./LotteryCalendarDA");
const LotteryDrawDA = require("./LotteryDrawDA");
const LotteryGameDA = require("./LotteryGameDA");
const LotterySheetConfigDA = require("./LotterySheetConfigDA");
const LotteryPrizeProgramDA = require("./LotteryPrizeProgramDA");
const LotteryQuotaDA = require("./LotteryQuotaDA");
const LotteryDA = require("./LotteryDA");

module.exports = {
  /**
   * domain start workflow
   */
  start$: Rx.concat(
    LotteryCalendarDA.start$(),
    LotteryDrawDA.start$(),
    LotteryGameDA.start$(),
    LotterySheetConfigDA.start$(),
    LotteryPrizeProgramDA.start$(),
    LotteryQuotaDA.start$(),
    LotteryDA.start$()
  ),
  LotteryCalendarDA,
  LotteryDrawDA,
  LotteryGameDA,
  LotterySheetConfigDA,
  LotteryPrizeProgramDA,
  LotteryQuotaDA,
  LotteryDA  
};
