"use strict";

const uuidv4 = require("uuid/v4");
const { of, interval } = require("rxjs");
const Event = require("@nebulae/event-store").Event;
const eventSourcing = require("../../tools/EventSourcing")();
const LotteryGameSheetConfigDA = require("../../data/LotteryGameSheetConfigDA");
const broker = require("../../tools/broker/BrokerFactory")();
const MATERIALIZED_VIEW_TOPIC = "materialized-view-updates";
const GraphqlResponseTools = require('../../tools/GraphqlResponseTools');
const RoleValidator = require("../../tools/RoleValidator");
const { take, mergeMap, catchError, map, toArray } = require('rxjs/operators');
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

class LotteryGameSheetConfigCQRS {
  constructor() {
  }

  /**  
   * Gets the LotteryGame
   *
   * @param {*} args args
   */
  getLotteryGameSheetConfig$({ args }, authToken) {
    return RoleValidator.checkPermissions$(
      authToken.realm_access.roles,
      "LotteryGameSheetConfig",
      "getLotteryGameSheetConfig",
      PERMISSION_DENIED,
      ["PLATFORM-ADMIN"]
    ).pipe(
      mergeMap(roles => {
        const isPlatformAdmin = roles["PLATFORM-ADMIN"];
        //If an user does not have the role to get the LotteryGame from other business, the query must be filtered with the businessId of the user
        const businessId = !isPlatformAdmin ? (authToken.businessId || '') : null;
        return LotteryGameSheetConfigDA.getLotteryGameSheetConfig$(args.id)
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
  getLotteryGameSheetConfigList$({ args }, authToken) {
    return RoleValidator.checkPermissions$(
      authToken.realm_access.roles,
      "LotteryGameSheetConfig",
      "getLotteryGameSheetConfigList",
      PERMISSION_DENIED,
      ["PLATFORM-ADMIN"]
    ).pipe(
      mergeMap(roles => {
        const filterInput = args.filterInput;

        return LotteryGameSheetConfigDA.getLotteryGameSheetConfigList$(filterInput);
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
  createLotteryGameSheetConfig$({ root, args, jwt }, authToken) {
    const lotteryGameSheetConfig = args ? args.input : undefined;
    lotteryGameSheetConfig._id = uuidv4();
    lotteryGameSheetConfig.creationUsername = authToken.preferred_username;
    lotteryGameSheetConfig.creationUserid = authToken.userid;
    lotteryGameSheetConfig.creationTimestamp = new Date().getTime();
    lotteryGameSheetConfig.editionUsername = authToken.preferred_username;
    lotteryGameSheetConfig.editionUserId = authToken.userId;
    lotteryGameSheetConfig.editionTimestamp = new Date().getTime();
    return RoleValidator.checkPermissions$(
      authToken.realm_access.roles,
      "LotteryGameSheetConfig",
      "createLotteryGameSheetConfig$",
      PERMISSION_DENIED,
      ["PLATFORM-ADMIN"]
    ).pipe(
      mergeMap(() => eventSourcing.eventStore.emitEvent$(
        new Event({
          eventType: "LotteryGameSheetConfigCreated",
          eventTypeVersion: 1,
          aggregateType: "LotteryGameSheetConfig",
          aggregateId: lotteryGameSheetConfig._id,
          data: lotteryGameSheetConfig,
          user: authToken.preferred_username
        }))
      ),
      map(() => ({ code: 200, message: `LotteryGameSheetConfig with id: ${lotteryGameSheetConfig._id} has been created` })),
      mergeMap(r => GraphqlResponseTools.buildSuccessResponse$(r)),
      catchError(err => GraphqlResponseTools.handleError$(err))
    );
  }

  /**
  * Edit the lotteryGame state
  */
  updateLotteryGameSheetConfig$({ root, args, jwt }, authToken) {
    const lotteryGameSheetConfig = {
      ...args.input, _id: args.id,
      approved: 'PENDING',
      editionUserId: authToken.user_id,
      editionUsername: authToken.preferred_username,
      editionTimestamp: new Date().getTime()
    };
    return RoleValidator.checkPermissions$(
      authToken.realm_access.roles,
      "LotteryGameSheetConfig",
      "updateLotteryGameSheetConfig$",
      PERMISSION_DENIED,
      ["PLATFORM-ADMIN"]
    ).pipe(
      mergeMap(() => eventSourcing.eventStore.emitEvent$(
        new Event({
          eventType: "LotteryGameSheetConfigUpdated",
          eventTypeVersion: 1,
          aggregateType: "LotteryGameSheetConfig",
          aggregateId: lotteryGameSheetConfig._id,
          data: lotteryGameSheetConfig,
          user: authToken.preferred_username
        })
      )
      ),
      map(() => ({ code: 200, message: `LotteryGameSheetConfig with id: ${lotteryGameSheetConfig._id} has been updated` })),
      mergeMap(r => GraphqlResponseTools.buildSuccessResponse$(r)),
      catchError(err => GraphqlResponseTools.handleError$(err))
    );
  }


  /**
   * Edit the lotteryGame state
   */
  approveLotteryGameSheetConfig$({ root, args, jwt }, authToken) {
    const lotteryGameSheetConfig = {
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
      "LotteryGameSheetConfig",
      "approveLotteryGameSheetConfig$",
      PERMISSION_DENIED,
      ["PLATFORM-ADMIN"]
    ).pipe(
      mergeMap(() => eventSourcing.eventStore.emitEvent$(
        new Event({
          eventType: "LotteryGameSheetConfigApproved",
          eventTypeVersion: 1,
          aggregateType: "LotteryGameSheetConfig",
          aggregateId: lotteryGameSheetConfig.id,
          data: lotteryGameSheetConfig,
          user: authToken.preferred_username
        })
      )
      ),
      map(() => ({ code: 200, message: `LotteryGameSheetConfig with id: ${lotteryGameSheetConfig._id} has been updated` })),
      mergeMap(r => GraphqlResponseTools.buildSuccessResponse$(r)),
      catchError(err => GraphqlResponseTools.handleError$(err))
    );
  }

  /**
   * Edit the lotteryGame state
   */
  revokeLotteryGameSheetConfig$({ root, args, jwt }, authToken) {
    const lotteryGameSheetConfig = {
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
      "LotteryGameSheetConfig",
      "revokeLotteryGameSheetConfig$",
      PERMISSION_DENIED,
      ["PLATFORM-ADMIN"]
    ).pipe(
      mergeMap(() => eventSourcing.eventStore.emitEvent$(
        new Event({
          eventType: "LotteryGameSheetConfigRevoked",
          eventTypeVersion: 1,
          aggregateType: "LotteryGameSheetConfig",
          aggregateId: lotteryGameSheetConfig.id,
          data: lotteryGameSheetConfig,
          user: authToken.preferred_username
        })
      )
      ),
      map(() => ({ code: 200, message: `LotteryGameSheetConfig with id: ${lotteryGameSheetConfig._id} has been updated` })),
      mergeMap(r => GraphqlResponseTools.buildSuccessResponse$(r)),
      catchError(err => GraphqlResponseTools.handleError$(err))
    );
  }




  //#endregion


}

/**
 * @returns {LotteryGameSheetConfigCQRS}
 */
module.exports = () => {
  if (!instance) {
    instance = new LotteryGameSheetConfigCQRS();
    console.log(`${instance.constructor.name} Singleton created`);
  }
  return instance;
};
