"use strict";

const uuidv4 = require("uuid/v4");
const { of, interval } = require("rxjs");
const Event = require("@nebulae/event-store").Event;
const eventSourcing = require("../../tools/EventSourcing")();
const LotteryGamePrizeProgramDA = require("../../data/LotteryGamePrizeProgramDA");
const broker = require("../../tools/broker/BrokerFactory")();
const MATERIALIZED_VIEW_TOPIC = "materialized-view-updates";
const GraphqlResponseTools = require('../../tools/GraphqlResponseTools');
const RoleValidator = require("../../tools/RoleValidator");
const { take, mergeMap, catchError, map, toArray, tap } = require('rxjs/operators');
const {
  CustomError,
  DefaultError,
  INTERNAL_SERVER_ERROR_CODE,
  PERMISSION_DENIED,
  GAME_SHEET_CONFIG_PENDIG_ERROR
} = require("../../tools/customError");



/**
 * Singleton instance
 */
let instance;

class LotteryGamePrizeProgramCQRS {
  constructor() {
  }

  /**  
   * Gets the LotteryGame
   *
   * @param {*} args args
   */
  getLotteryGamePrizeProgram$({ args }, authToken) {
    return RoleValidator.checkPermissions$(
      authToken.realm_access.roles,
      "LotteryGamePrizeProgram",
      "getLotteryGamePrizeProgram",
      PERMISSION_DENIED,
      ["PLATFORM-ADMIN", "LOTTERY-ADMIN", "LOTTERY-APPROVER"]
    ).pipe(
      mergeMap(roles => {
        const isPlatformAdmin = roles["PLATFORM-ADMIN"];
        //If an user does not have the role to get the LotteryGame from other business, the query must be filtered with the businessId of the user
        const businessId = !isPlatformAdmin ? (authToken.businessId || '') : null;
        return LotteryGamePrizeProgramDA.getLotteryGamePrizeProgram$(args.id)
      }),
      mergeMap(rawResponse => GraphqlResponseTools.buildSuccessResponse$(rawResponse)),
      catchError(err => GraphqlResponseTools.handleError$(error))
    );
  }

  /**  
   * Gets the LotteryGame list
   *
   * @param {*} args args
   */
  getLotteryGamePrizeProgramList$({ args }, authToken) {
    return RoleValidator.checkPermissions$(
      authToken.realm_access.roles,
      "LotteryGamePrizeProgram",
      "getLotteryGamePrizeProgramList",
      PERMISSION_DENIED,
      ["PLATFORM-ADMIN", "LOTTERY-ADMIN", "LOTTERY-APPROVER"]
    ).pipe(
      mergeMap(roles => {
        const filterInput = args.filterInput;

        return LotteryGamePrizeProgramDA.getLotteryGamePrizeProgramList$(filterInput);
      }),
      toArray(),
      mergeMap(rawResponse => GraphqlResponseTools.buildSuccessResponse$(rawResponse)),
      catchError(err => {
        console.error(err);
        GraphqlResponseTools.handleError$(err)
      })
    );
  }

  /**
* Create a lotteryGame
*/
  createLotteryGamePrizeProgram$({ root, args, jwt }, authToken) {
    const lotteryGamePrizeProgram = args ? args.input : undefined;
    lotteryGamePrizeProgram._id = uuidv4();
    lotteryGamePrizeProgram.creationUsername = authToken.preferred_username;
    lotteryGamePrizeProgram.creationUserid = authToken.userid;
    lotteryGamePrizeProgram.creationTimestamp = new Date().getTime();
    lotteryGamePrizeProgram.editionUsername = authToken.preferred_username;
    lotteryGamePrizeProgram.editionUserId = authToken.userId;
    lotteryGamePrizeProgram.editionTimestamp = new Date().getTime();
    return RoleValidator.checkPermissions$(
      authToken.realm_access.roles,
      "LotteryGamePrizeProgram",
      "createLotteryGamePrizeProgram$",
      PERMISSION_DENIED,
      ["PLATFORM-ADMIN", "LOTTERY-ADMIN"]
    ).pipe(
      mergeMap(() => eventSourcing.eventStore.emitEvent$(
        new Event({
          eventType: "LotteryGamePrizeProgramCreated",
          eventTypeVersion: 1,
          aggregateType: "LotteryGamePrizeProgram",
          aggregateId: lotteryGamePrizeProgram._id,
          data: lotteryGamePrizeProgram,
          user: authToken.preferred_username
        }))
      ),
      map(() => ({ code: 200, message: `LotteryGamePrizeProgram with id: ${lotteryGamePrizeProgram._id} has been created` })),
      mergeMap(r => GraphqlResponseTools.buildSuccessResponse$(r)),
      catchError(err => GraphqlResponseTools.handleError$(err))
    );
  }

  /**
  * Edit the lotteryGame state
  */
  updateLotteryGamePrizeProgram$({ root, args, jwt }, authToken) {
    const lotteryGamePrizeProgram = {
      ...args.input, _id: args.id,
      approved: 'PENDING',
      editionUserId: authToken.user_id,
      editionUsername: authToken.preferred_username,
      editionTimestamp: new Date().getTime()
    };
    return RoleValidator.checkPermissions$(
      authToken.realm_access.roles,
      "LotteryGamePrizeProgram",
      "updateLotteryGamePrizeProgram$",
      PERMISSION_DENIED,
      ["PLATFORM-ADMIN", "LOTTERY-ADMIN"]
    ).pipe(
      mergeMap(() => eventSourcing.eventStore.emitEvent$(
        new Event({
          eventType: "LotteryGamePrizeProgramUpdated",
          eventTypeVersion: 1,
          aggregateType: "LotteryGamePrizeProgram",
          aggregateId: lotteryGamePrizeProgram._id,
          data: lotteryGamePrizeProgram,
          user: authToken.preferred_username
        })
      )
      ),
      map(() => ({ code: 200, message: `LotteryGamePrizeProgram with id: ${lotteryGamePrizeProgram._id} has been updated` })),
      mergeMap(r => GraphqlResponseTools.buildSuccessResponse$(r)),
      catchError(err => GraphqlResponseTools.handleError$(err))
    );
  }


  /**
   * Edit the lotteryGame state
   */
  approveLotteryGamePrizeProgram$({ root, args, jwt }, authToken) {
    const lotteryGamePrizeProgram = {
      ...args,
      editionUserId: authToken.user_id,
      editionUsername: authToken.preferred_username,
      editionTimestamp: new Date().getTime(),
      approvedUserId: authToken.user_id,
      approvedUsername: authToken.preferred_username,
      approvedTimestamp: new Date().getTime()
    };

    return RoleValidator.checkPermissions$(
      authToken.realm_access.roles,
      "LotteryGamePrizeProgram",
      "approveLotteryGamePrizeProgram$",
      PERMISSION_DENIED,
      ["PLATFORM-ADMIN", "LOTTERY-APPROVER"]
    ).pipe(
      mergeMap(() => eventSourcing.eventStore.emitEvent$(
        new Event({
          eventType: "LotteryGamePrizeProgramApproved",
          eventTypeVersion: 1,
          aggregateType: "LotteryGamePrizeProgram",
          aggregateId: lotteryGamePrizeProgram.id,
          data: lotteryGamePrizeProgram,
          user: authToken.preferred_username
        })
      )
      ),
      map(() => ({ code: 200, message: `LotteryGamePrizeProgram with id: ${lotteryGamePrizeProgram._id} has been updated` })),
      mergeMap(r => GraphqlResponseTools.buildSuccessResponse$(r)),
      catchError(err => GraphqlResponseTools.handleError$(err))
    );
  }

  /**
   * Edit the lotteryGame state
   */
  revokeLotteryGamePrizeProgram$({ root, args, jwt }, authToken) {
    const lotteryGamePrizeProgram = {
      ...args,
      editionUserId: authToken.user_id,
      editionUsername: authToken.preferred_username,
      editionTimestamp: new Date().getTime(),
      revokedUserId: authToken.user_id,
      revokedUsername: authToken.preferred_username,
      revokedTimestamp: new Date().getTime()
    };

    return RoleValidator.checkPermissions$(
      authToken.realm_access.roles,
      "LotteryGamePrizeProgram",
      "revokeLotteryGamePrizeProgram$",
      PERMISSION_DENIED,
      ["PLATFORM-ADMIN", "LOTTERY-APPROVER"]
    ).pipe(
      mergeMap(() => eventSourcing.eventStore.emitEvent$(
        new Event({
          eventType: "LotteryGamePrizeProgramRevoked",
          eventTypeVersion: 1,
          aggregateType: "LotteryGamePrizeProgram",
          aggregateId: lotteryGamePrizeProgram.id,
          data: lotteryGamePrizeProgram,
          user: authToken.preferred_username
        })
      )
      ),
      map(() => ({ code: 200, message: `LotteryGamePrizeProgram with id: ${lotteryGamePrizeProgram._id} has been updated` })),
      mergeMap(r => GraphqlResponseTools.buildSuccessResponse$(r)),
      catchError(err => GraphqlResponseTools.handleError$(err))
    );
  }




  //#endregion


}

/**
 * @returns {LotteryGamePrizeProgramCQRS}
 */
module.exports = () => {
  if (!instance) {
    instance = new LotteryGamePrizeProgramCQRS();
    console.log(`${instance.constructor.name} Singleton created`);
  }
  return instance;
};
