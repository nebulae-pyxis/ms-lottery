"use strict";

const uuidv4 = require("uuid/v4");
const { of, interval } = require("rxjs");
const Event = require("@nebulae/event-store").Event;
const eventSourcing = require("../../tools/EventSourcing")();
const LotteryDA = require("../../data/LotteryDA");
const broker = require("../../tools/broker/BrokerFactory")();
const MATERIALIZED_VIEW_TOPIC = "materialized-view-updates";
const GraphqlResponseTools = require('../../tools/GraphqlResponseTools');
const RoleValidator = require("../../tools/RoleValidator");
const { take, mergeMap, catchError, map, toArray } = require('rxjs/operators');
const {
  CustomError,
  DefaultError,
  INTERNAL_SERVER_ERROR_CODE,
  PERMISSION_DENIED
} = require("../../tools/customError");



/**
 * Singleton instance
 */
let instance;

class LotteryCQRS {
  constructor() {
  }

  /**  
   * Gets the Lottery
   *
   * @param {*} args args
   */
  getLottery$({ args }, authToken) {
    return RoleValidator.checkPermissions$(
      authToken.realm_access.roles,
      "Lottery",
      "getLottery",
      PERMISSION_DENIED,
      ["PLATFORM-ADMIN", "LOTTERY-ADMIN", "LOTTERY-APPROVER"]
    ).pipe(
      mergeMap(roles => {
        const isPlatformAdmin = roles["PLATFORM-ADMIN"];
        //If an user does not have the role to get the Lottery from other business, the query must be filtered with the businessId of the user
        const businessId = !isPlatformAdmin? (authToken.businessId || ''): null;
        return LotteryDA.getLottery$(args.id, businessId)
      }),
      mergeMap(rawResponse => GraphqlResponseTools.buildSuccessResponse$(rawResponse)),
      catchError(err => GraphqlResponseTools.handleError$(error))
    );
  }

  /**  
   * Gets the Lottery list
   *
   * @param {*} args args
   */
  getLotteryList$({ args }, authToken) {
    return RoleValidator.checkPermissions$(
      authToken.realm_access.roles,
      "Lottery",
      "getLotteryList",
      PERMISSION_DENIED,
      ["PLATFORM-ADMIN", "LOTTERY-ADMIN", "LOTTERY-APPROVER"]
    ).pipe(
      mergeMap(roles => {
        const filterInput = args.filterInput;

        return LotteryDA.getLotteryList$(filterInput, args.paginationInput);
      }),
      toArray(),
      mergeMap(rawResponse => GraphqlResponseTools.buildSuccessResponse$(rawResponse)),
      catchError(err => GraphqlResponseTools.handleError$(err))
    );
  }

    /**  
   * Gets the amount of the Lottery according to the filter
   *
   * @param {*} args args
   */
  getLotteryListSize$({ args }, authToken) {
    return RoleValidator.checkPermissions$(
      authToken.realm_access.roles,
      "Lottery",
      "getLotteryListSize",
      PERMISSION_DENIED,
      ["PLATFORM-ADMIN", "LOTTERY-ADMIN", "LOTTERY-APPROVER"]
    ).pipe(
      mergeMap(roles => {
        const isPlatformAdmin = roles["PLATFORM-ADMIN"];
        //If an user does not have the role to get the Lottery from other business, the query must be filtered with the businessId of the user
        const businessId = !isPlatformAdmin? (authToken.businessId || ''): args.filterInput.businessId;
        const filterInput = args.filterInput;
        filterInput.businessId = businessId;

        return LotteryDA.getLotterySize$(filterInput);
      }),
      mergeMap(rawResponse => GraphqlResponseTools.buildSuccessResponse$(rawResponse)),
      catchError(err => GraphqlResponseTools.handleError$(err))
    );
  }

    /**
  * Create a lottery
  */
 createLottery$({ root, args, jwt }, authToken) {
    const lottery = args ? args.input: undefined;
    lottery._id = uuidv4();
    lottery.creatorUser = authToken.preferred_username;
    lottery.creationTimestamp = new Date().getTime();
    lottery.modifierUser = authToken.preferred_username;
    lottery.modificationTimestamp = new Date().getTime();

    return RoleValidator.checkPermissions$(
      authToken.realm_access.roles,
      "Lottery",
      "createLottery$",
      PERMISSION_DENIED,
      ["PLATFORM-ADMIN", "LOTTERY-ADMIN"]
    ).pipe(
      mergeMap(() => eventSourcing.eventStore.emitEvent$(
        new Event({
          eventType: "LotteryCreated",
          eventTypeVersion: 1,
          aggregateType: "Lottery",
          aggregateId: lottery._id,
          data: lottery,
          user: authToken.preferred_username
        }))
      ),
      map(() => ({ code: 200, message: `Lottery with id: ${lottery._id} has been created` })),
      mergeMap(r => GraphqlResponseTools.buildSuccessResponse$(r)),
      catchError(err => GraphqlResponseTools.handleError$(err))
    );
  }

    /**
   * Edit the lottery state
   */
  updateLotteryGeneralInfo$({ root, args, jwt }, authToken) {
    const lottery = {
      _id: args.id,
      generalInfo: args.input,
      modifierUser: authToken.preferred_username,
      modificationTimestamp: new Date().getTime()
    };

    return RoleValidator.checkPermissions$(
      authToken.realm_access.roles,
      "Lottery",
      "updateLotteryGeneralInfo$",
      PERMISSION_DENIED,
      ["PLATFORM-ADMIN", "LOTTERY-ADMIN"]
    ).pipe(
      mergeMap(() => eventSourcing.eventStore.emitEvent$(
        new Event({
          eventType: "LotteryGeneralInfoUpdated",
          eventTypeVersion: 1,
          aggregateType: "Lottery",
          aggregateId: lottery._id,
          data: lottery,
          user: authToken.preferred_username
        })
      )
      ),
      map(() => ({ code: 200, message: `Lottery with id: ${lottery._id} has been updated` })),
      mergeMap(r => GraphqlResponseTools.buildSuccessResponse$(r)),
      catchError(err => GraphqlResponseTools.handleError$(err))
    );
  }


  /**
   * Edit the lottery state
   */
  updateLotteryState$({ root, args, jwt }, authToken) {
    const lottery = {
      _id: args.id,
      state: args.newState,
      modifierUser: authToken.preferred_username,
      modificationTimestamp: new Date().getTime()
    };

    return RoleValidator.checkPermissions$(
      authToken.realm_access.roles,
      "Lottery",
      "updateLotteryState$",
      PERMISSION_DENIED,
      ["PLATFORM-ADMIN", "LOTTERY-ADMIN"]
    ).pipe(
      mergeMap(() => eventSourcing.eventStore.emitEvent$(
        new Event({
          eventType: "LotteryStateUpdated",
          eventTypeVersion: 1,
          aggregateType: "Lottery",
          aggregateId: lottery._id,
          data: lottery,
          user: authToken.preferred_username
        })
      )
      ),
      map(() => ({ code: 200, message: `Lottery with id: ${lottery._id} has been updated` })),
      mergeMap(r => GraphqlResponseTools.buildSuccessResponse$(r)),
      catchError(err => GraphqlResponseTools.handleError$(err))
    );
  }


  //#endregion


}

/**
 * @returns {LotteryCQRS}
 */
module.exports = () => {
  if (!instance) {
    instance = new LotteryCQRS();
    console.log(`${instance.constructor.name} Singleton created`);
  }
  return instance;
};
