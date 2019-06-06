"use strict";

const uuidv4 = require("uuid/v4");
const { of, interval } = require("rxjs");
const Event = require("@nebulae/event-store").Event;
const eventSourcing = require("../../tools/EventSourcing")();
const LotteryGameQuotaDA = require("../../data/LotteryGameQuotaDA");
const LotteryGameQuotaNumberDA = require("../../data/LotteryGameQuotaNumberDA");
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

class LotteryGameQuotaCQRS {
  constructor() {
  }

  /**  
   * Gets the LotteryGame
   *
   * @param {*} args args
   */
  getLotteryGameQuota$({ args }, authToken) {
    return RoleValidator.checkPermissions$(
      authToken.realm_access.roles,
      "LotteryGameQuota",
      "getLotteryGameQuota",
      PERMISSION_DENIED,
      ["PLATFORM-ADMIN", "LOTTERY-ADMIN", "LOTTERY-APPROVER"]
    ).pipe(
      mergeMap(roles => {
        const isPlatformAdmin = roles["PLATFORM-ADMIN"];
        //If an user does not have the role to get the LotteryGame from other business, the query must be filtered with the businessId of the user
        const businessId = !isPlatformAdmin ? (authToken.businessId || '') : null;
        return LotteryGameQuotaDA.getLotteryGameQuota$(args.id)
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
  getLotteryGameQuotaList$({ args }, authToken) {
    return RoleValidator.checkPermissions$(
      authToken.realm_access.roles,
      "LotteryGameQuota",
      "getLotteryGameQuotaList",
      PERMISSION_DENIED,
      ["PLATFORM-ADMIN", "LOTTERY-ADMIN", "LOTTERY-APPROVER"]
    ).pipe(
      mergeMap(roles => {
        const filterInput = args.filterInput;

        return LotteryGameQuotaDA.getLotteryGameQuotaList$(filterInput);
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
  createLotteryGameQuota$({ root, args, jwt }, authToken) {
    const lotteryGameQuota = args ? args.input : undefined;
    lotteryGameQuota._id = uuidv4();
    lotteryGameQuota.creationUsername = authToken.preferred_username;
    lotteryGameQuota.creationUserid = authToken.userid;
    lotteryGameQuota.creationTimestamp = new Date().getTime();
    lotteryGameQuota.editionUsername = authToken.preferred_username;
    lotteryGameQuota.editionUserId = authToken.userId;
    lotteryGameQuota.editionTimestamp = new Date().getTime();
    return RoleValidator.checkPermissions$(
      authToken.realm_access.roles,
      "LotteryGameQuota",
      "createLotteryGameQuota$",
      PERMISSION_DENIED,
      ["PLATFORM-ADMIN", "LOTTERY-ADMIN"]
    ).pipe(
      mergeMap(() => eventSourcing.eventStore.emitEvent$(
        new Event({
          eventType: "LotteryGameQuotaCreated",
          eventTypeVersion: 1,
          aggregateType: "LotteryGameQuota",
          aggregateId: lotteryGameQuota._id,
          data: lotteryGameQuota,
          user: authToken.preferred_username
        }))
      ),
      map(() => ({ code: 200, message: `LotteryGameQuota with id: ${lotteryGameQuota._id} has been created` })),
      mergeMap(r => GraphqlResponseTools.buildSuccessResponse$(r)),
      catchError(err => GraphqlResponseTools.handleError$(err))
    );
  }

  /**
  * Edit the lotteryGame state
  */
  updateLotteryGameQuota$({ root, args, jwt }, authToken) {
    const lotteryGameQuota = {
      ...args.input, _id: args.id,
      editionUserId: authToken.user_id,
      editionUsername: authToken.preferred_username,
      editionTimestamp: new Date().getTime()
    };
    return RoleValidator.checkPermissions$(
      authToken.realm_access.roles,
      "LotteryGameQuota",
      "updateLotteryGameQuota$",
      PERMISSION_DENIED,
      ["PLATFORM-ADMIN", "LOTTERY-ADMIN"]
    ).pipe(
      mergeMap(() => eventSourcing.eventStore.emitEvent$(
        new Event({
          eventType: "LotteryGameQuotaUpdated",
          eventTypeVersion: 1,
          aggregateType: "LotteryGameQuota",
          aggregateId: lotteryGameQuota._id,
          data: lotteryGameQuota,
          user: authToken.preferred_username
        })
      )
      ),
      map(() => ({ code: 200, message: `LotteryGameQuota with id: ${lotteryGameQuota._id} has been updated` })),
      mergeMap(r => GraphqlResponseTools.buildSuccessResponse$(r)),
      catchError(err => GraphqlResponseTools.handleError$(err))
    );
  }


  /**
   * Edit the lotteryGame state
   */
  approveLotteryGameQuota$({ root, args, jwt }, authToken) {
    const lotteryGameQuota = {
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
      "LotteryGameQuota",
      "approveLotteryGameQuota$",
      PERMISSION_DENIED,
      ["PLATFORM-ADMIN", "LOTTERY-APPROVER"]
    ).pipe(
      mergeMap(() => eventSourcing.eventStore.emitEvent$(
        new Event({
          eventType: "LotteryGameQuotaApproved",
          eventTypeVersion: 1,
          aggregateType: "LotteryGameQuota",
          aggregateId: lotteryGameQuota.id,
          data: lotteryGameQuota,
          user: authToken.preferred_username
        })
      )
      ),
      map(() => ({ code: 200, message: `LotteryGameQuota with id: ${lotteryGameQuota._id} has been updated` })),
      mergeMap(r => GraphqlResponseTools.buildSuccessResponse$(r)),
      catchError(err => GraphqlResponseTools.handleError$(err))
    );
  }

  /**
   * Edit the lotteryGame state
   */
  revokeLotteryGameQuota$({ root, args, jwt }, authToken) {
    const lotteryGameQuota = {
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
      "LotteryGameQuota",
      "revokeLotteryGameQuota$",
      PERMISSION_DENIED,
      ["PLATFORM-ADMIN", "LOTTERY-APPROVER"]
    ).pipe(
      mergeMap(() => eventSourcing.eventStore.emitEvent$(
        new Event({
          eventType: "LotteryGameQuotaRevoked",
          eventTypeVersion: 1,
          aggregateType: "LotteryGameQuota",
          aggregateId: lotteryGameQuota.id,
          data: lotteryGameQuota,
          user: authToken.preferred_username
        })
      )
      ),
      map(() => ({ code: 200, message: `LotteryGameQuota with id: ${lotteryGameQuota._id} has been updated` })),
      mergeMap(r => GraphqlResponseTools.buildSuccessResponse$(r)),
      catchError(err => GraphqlResponseTools.handleError$(err))
    );
  }



  /**  
   * Gets the LotteryGame list
   *
   * @param {*} args args
   */
  getLotteryGameQuotaNumberList$({ args }, authToken) {
    return RoleValidator.checkPermissions$(
      authToken.realm_access.roles,
      "LotteryGameQuota",
      "getLotteryGameQuotaNumberList",
      PERMISSION_DENIED,
      ["PLATFORM-ADMIN", "LOTTERY-ADMIN", "LOTTERY-APPROVER"]
    ).pipe(
      mergeMap(roles => {
        const filterInput = args.filterInput;

        return LotteryGameQuotaNumberDA.getLotteryGameQuotaNumberList$(filterInput);
      }),
      toArray(),
      mergeMap(rawResponse => GraphqlResponseTools.buildSuccessResponse$(rawResponse)),
      catchError(err => {
        console.error(err);
        GraphqlResponseTools.handleError$(err)
      })
    );
  }

  getLotteryGameQuotaNumberListSize$({ args }, authToken) {
    console.log('llgan args: ', args);
    return RoleValidator.checkPermissions$(
      authToken.realm_access.roles,
      "LotteryGameQuota",
      "getLotteryGameQuotaNumberListSize",
      PERMISSION_DENIED,
      ["PLATFORM-ADMIN", "LOTTERY-ADMIN", "LOTTERY-APPROVER"]
    ).pipe(
      mergeMap(roles => {
        const filterInput = args.filterInput;

        return LotteryGameQuotaNumberDA.getLotteryGameQuotaNumberListSize$(filterInput);
      }),
      tap(result => console.log('resultado de consulta: ',result)),
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
  createLotteryGameQuotaNumber$({ root, args, jwt }, authToken) {
    const lotteryGameQuotaNumberList = args ? args.input : undefined;
    return RoleValidator.checkPermissions$(
      authToken.realm_access.roles,
      "LotteryGameQuota",
      "createLotteryGameQuotaNumber$",
      PERMISSION_DENIED,
      ["PLATFORM-ADMIN", "LOTTERY-ADMIN"]
    ).pipe(
      mergeMap(() => eventSourcing.eventStore.emitEvent$(
        new Event({
          eventType: "LotteryGameQuotaNumberCreated",
          eventTypeVersion: 1,
          aggregateType: "LotteryGameQuota",
          aggregateId: args.quotaId,
          data: {lotteryGameQuotaNumberList, gameId: args.gameId, lotteryId: args.lotteryId, quotaId: args.quotaId},
          user: authToken.preferred_username
        }))
      ),
      map(() => ({ code: 200, message: `LotteryGameQuotaNumber has been created` })),
      mergeMap(r => GraphqlResponseTools.buildSuccessResponse$(r)),
      catchError(err => GraphqlResponseTools.handleError$(err))
    );
  }

  removeLotteryGameQuotaNumber$({ root, args, jwt }, authToken) {
    return RoleValidator.checkPermissions$(
      authToken.realm_access.roles,
      "LotteryGameQuota",
      "removeLotteryGameQuotaNumber$",
      PERMISSION_DENIED,
      ["PLATFORM-ADMIN", "LOTTERY-ADMIN"]
    ).pipe(
      mergeMap(() => eventSourcing.eventStore.emitEvent$(
        new Event({
          eventType: "LotteryGameQuotaNumberRemoved",
          eventTypeVersion: 1,
          aggregateType: "LotteryGameQuota",
          aggregateId: args.quotaId,
          data: args.quotaId,
          user: authToken.preferred_username
        }))
      ),
      map(() => ({ code: 200, message: `LotteryGameQuotaNumber has been removed` })),
      mergeMap(r => GraphqlResponseTools.buildSuccessResponse$(r)),
      catchError(err => GraphqlResponseTools.handleError$(err))
    );
  }


  //#endregion


}

/**
 * @returns {LotteryGameQuotaCQRS}
 */
module.exports = () => {
  if (!instance) {
    instance = new LotteryGameQuotaCQRS();
    console.log(`${instance.constructor.name} Singleton created`);
  }
  return instance;
};
