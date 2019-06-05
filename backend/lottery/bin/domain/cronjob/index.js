"use strict";

const Rx = require('rxjs');
const CronjobES = require("./CronjobES")();
const DataAccess = require("./data-access");

module.exports = {
  /**
   * domain start workflow
   */
  start$: DataAccess.start$,
  /**
   * @returns {CronjobES}
   */
  CronjobES,
};
