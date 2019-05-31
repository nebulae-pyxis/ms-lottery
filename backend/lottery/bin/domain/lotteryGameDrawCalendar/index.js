"use strict";

const LotteryGameDrawCalendarCQRS = require("./LotteryGameDrawCalendarCQRS")();
const LotteryGameDrawCalendarES = require("./LotteryGameDrawCalendarES")();

module.exports = {
  /**
   * @returns {LotteryGameDrawCalendarCQRS}
   */
  LotteryGameDrawCalendarCQRS,
  /**
   * @returns {LotteryGameDrawCalendarES}
   */
  LotteryGameDrawCalendarES
};
