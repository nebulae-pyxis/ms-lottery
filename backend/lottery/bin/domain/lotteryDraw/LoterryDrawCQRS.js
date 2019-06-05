"use strict";

const uuidv4 = require("uuid/v4");
const { of, interval, forkJoin, from } = require("rxjs");
const { mergeMapTo, mergeMap, catchError, map, toArray, filter, first, tap ,defaultIfEmpty} = require('rxjs/operators');

const RoleValidator = require("../../tools/RoleValidator");
const { Event } = require("@nebulae/event-store");
const eventSourcing = require("../../tools/EventSourcing")();
const broker = require("../../tools/broker/BrokerFactory")();
const GraphqlResponseTools = require('../../tools/GraphqlResponseTools');
const Crosscutting = require('../../tools/Crosscutting');
const {
  CustomError,
  DefaultError,
  INTERNAL_SERVER_ERROR_CODE,
  PERMISSION_DENIED  
} = require("../../tools/customError");

const LotteryDrawDA = require('./data-access/LotteryDrawDA')


/**
 * Singleton instance
 */
let instance;

class LotteryDrawCQRS {
  constructor() {
  }

  lotteryLoteryOptions$({ root, args, jwt }, authToken) {
    // console.log("lotteryLoteryOptions$ ==> ", args);    
    const requiredRoles = ["PLATFORM-ADMIN"];
    return RoleValidator.checkPermissions$(authToken.realm_access.roles, "LotteryDrawCQRS", "lotteryLoteryOptions", PERMISSION_DENIED, requiredRoles)
      .pipe(      
        tap(x => console.log(`LotteryDraw.lotteryLoteryOptions RESP: ${JSON.stringify(x)}`)),//DEBUG: DELETE LINE
        map(() => [{id: 'q1w2-e3r4', name: 'monteria'}, { id: '2w3e-4r5t', }]),
        mergeMap(rawResponse => GraphqlResponseTools.buildSuccessResponse$(rawResponse)),      
        catchError(err => GraphqlResponseTools.handleError$(err, true))
      );
  }
  lotteryDraws$({ root, args, jwt }, authToken) {
    // console.log("lotteryDraws$ ==> ", args);
    const requiredRoles = ["PLATFORM-ADMIN"];
    return RoleValidator.checkPermissions$(authToken.realm_access.roles, "LotteryDrawCQRS", "lotteryDraws", PERMISSION_DENIED, requiredRoles)
      .pipe(      
        tap(x => console.log(`LotteryDraw.lotteryDraws RESP: ${JSON.stringify(x)}`)),//DEBUG: DELETE LINE
        map(() => []),
        mergeMap(rawResponse => GraphqlResponseTools.buildSuccessResponse$(rawResponse)),      
        catchError(err => GraphqlResponseTools.handleError$(err, true))
      );
  }

  lotteryDrawsSize$({ root, args, jwt }, authToken) {
    // console.log("lotteryDrawsSize$ ==> ", args);
    const requiredRoles = ["PLATFORM-ADMIN"];
    return RoleValidator.checkPermissions$(authToken.realm_access.roles, "LotteryDrawCQRS", "lotteryDrawsSize", PERMISSION_DENIED, requiredRoles)
      .pipe(      
        tap(x => console.log(`LotteryDraw.lotteryDrawsSize RESP: ${JSON.stringify(x)}`)),//DEBUG: DELETE LINE
        map(() => 75),
        mergeMap(rawResponse => GraphqlResponseTools.buildSuccessResponse$(rawResponse)),      
        catchError(err => GraphqlResponseTools.handleError$(err, true))
      );
  }

  lotteryDrawConfirmResults$({ root, args, jwt }, authToken) {
    // console.log("lotteryDrawConfirmResults$ ==> ", args);
    const requiredRoles = ["PLATFORM-ADMIN"];
    return RoleValidator.checkPermissions$(authToken.realm_access.roles, "LotteryDrawCQRS", "lotteryDrawConfirmResults", PERMISSION_DENIED, requiredRoles)
      .pipe(      
        tap(x => console.log(`LotteryDraw.lotteryDrawConfirmResults RESP: ${JSON.stringify(x)}`)),//DEBUG: DELETE LINE
        map(() => ({code: 200, message: 'Results were confirmed successful'})),
        mergeMap(rawResponse => GraphqlResponseTools.buildSuccessResponse$(rawResponse)),      
        catchError(err => GraphqlResponseTools.handleError$(err, true))
      );
  }

  lotteryDrawApproveResults$({ root, args, jwt }, authToken) {
    // console.log("lotteryDrawApproveResults$ ==> ", args);
    const requiredRoles = ["PLATFORM-ADMIN"];
    return RoleValidator.checkPermissions$(authToken.realm_access.roles, "LotteryDrawCQRS", "lotteryDrawApproveResults", PERMISSION_DENIED, requiredRoles)
      .pipe(      
        tap(x => console.log(`LotteryDraw.lotteryDrawApproveResults RESP: ${JSON.stringify(x)}`)),//DEBUG: DELETE LINE
        map(() => ({code: 200, message: 'Draw results were approved successfull'})),
        mergeMap(rawResponse => GraphqlResponseTools.buildSuccessResponse$(rawResponse)),      
        catchError(err => GraphqlResponseTools.handleError$(err, true))
      );
  }


}

/**
 * @returns {LotteryDrawCQRS}
 */
module.exports = () => {
  if (!instance) {
    instance = new LotteryDrawCQRS();
    console.log(`${instance.constructor.name} Singleton created`);
  }
  return instance;
};
