"use strict";

const uuidv4 = require("uuid/v4");
const { of, interval } = require("rxjs");
const Event = require("@nebulae/event-store").Event;
const eventSourcing = require("../../tools/EventSourcing")();
const LotteryGameDA = require("../../data/LotteryGameDA");
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

class LotteryGameCQRS {
  constructor() {
  }

  /**  
   * Gets the LotteryGame
   *
   * @param {*} args args
   */
  getLotteryGame$({ args }, authToken) {
    return RoleValidator.checkPermissions$(
      authToken.realm_access.roles,
      "LotteryGame",
      "getLotteryGame",
      PERMISSION_DENIED,
      ["PLATFORM-ADMIN", "LOTTERY-ADMIN", "LOTTERY-APPROVER"]
    ).pipe(
      mergeMap(roles => {
        const isPlatformAdmin = roles["PLATFORM-ADMIN"];
        //If an user does not have the role to get the LotteryGame from other business, the query must be filtered with the businessId of the user
        const businessId = !isPlatformAdmin? (authToken.businessId || ''): null;
        return LotteryGameDA.getLotteryGame$(args.id, businessId)
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
  getLotteryGameList$({ args }, authToken) {
    return RoleValidator.checkPermissions$(
      authToken.realm_access.roles,
      "LotteryGame",
      "getLotteryGameList",
      PERMISSION_DENIED,
      ["PLATFORM-ADMIN", "LOTTERY-ADMIN", "LOTTERY-APPROVER"]
    ).pipe(
      mergeMap(roles => {
        const isPlatformAdmin = roles["PLATFORM-ADMIN"];
        //If an user does not have the role to get the LotteryGame from other business, the query must be filtered with the businessId of the user
        const businessId = !isPlatformAdmin? (authToken.businessId || ''): args.filterInput.businessId;
        const filterInput = args.filterInput;
        filterInput.businessId = businessId;

        return LotteryGameDA.getLotteryGameList$(filterInput, args.paginationInput);
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
   * Gets the amount of the LotteryGame according to the filter
   *
   * @param {*} args args
   */
  getLotteryGameListSize$({ args }, authToken) {
    return RoleValidator.checkPermissions$(
      authToken.realm_access.roles,
      "LotteryGame",
      "getLotteryGameListSize",
      PERMISSION_DENIED,
      ["PLATFORM-ADMIN", "LOTTERY-ADMIN", "LOTTERY-APPROVER"]
    ).pipe(
      mergeMap(roles => {
        const isPlatformAdmin = roles["PLATFORM-ADMIN"];
        //If an user does not have the role to get the LotteryGame from other business, the query must be filtered with the businessId of the user
        const businessId = !isPlatformAdmin? (authToken.businessId || ''): args.filterInput.businessId;
        const filterInput = args.filterInput;
        filterInput.businessId = businessId;

        return LotteryGameDA.getLotteryGameSize$(filterInput);
      }),
      mergeMap(rawResponse => GraphqlResponseTools.buildSuccessResponse$(rawResponse)),
      catchError(err => GraphqlResponseTools.handleError$(err))
    );
  }

    /**
  * Create a lotteryGame
  */
 createLotteryGame$({ root, args, jwt }, authToken) {
    const lotteryGame = args ? args.input: undefined;
    lotteryGame._id = uuidv4();
    lotteryGame.creatorUser = authToken.preferred_username;
    lotteryGame.creationTimestamp = new Date().getTime();
    lotteryGame.modifierUser = authToken.preferred_username;
    lotteryGame.modificationTimestamp = new Date().getTime();

    return RoleValidator.checkPermissions$(
      authToken.realm_access.roles,
      "LotteryGame",
      "createLotteryGame$",
      PERMISSION_DENIED,
      ["PLATFORM-ADMIN", "LOTTERY-ADMIN"]
    ).pipe(
      mergeMap(() => eventSourcing.eventStore.emitEvent$(
        new Event({
          eventType: "LotteryGameCreated",
          eventTypeVersion: 1,
          aggregateType: "LotteryGame",
          aggregateId: lotteryGame._id,
          data: lotteryGame,
          user: authToken.preferred_username
        }))
      ),
      map(() => ({ code: 200, message: `LotteryGame with id: ${lotteryGame._id} has been created` })),
      mergeMap(r => GraphqlResponseTools.buildSuccessResponse$(r)),
      catchError(err => GraphqlResponseTools.handleError$(err))
    );
  }

    /**
   * Edit the lotteryGame state
   */
  updateLotteryGameGeneralInfo$({ root, args, jwt }, authToken) {
    const lotteryGame = {
      _id: args.id,
      generalInfo: args.input,
      modifierUser: authToken.preferred_username,
      modificationTimestamp: new Date().getTime()
    };

    return RoleValidator.checkPermissions$(
      authToken.realm_access.roles,
      "LotteryGame",
      "updateLotteryGameGeneralInfo$",
      PERMISSION_DENIED,
      ["PLATFORM-ADMIN", "LOTTERY-ADMIN"]
    ).pipe(
      mergeMap(() => eventSourcing.eventStore.emitEvent$(
        new Event({
          eventType: "LotteryGameGeneralInfoUpdated",
          eventTypeVersion: 1,
          aggregateType: "LotteryGame",
          aggregateId: lotteryGame._id,
          data: lotteryGame,
          user: authToken.preferred_username
        })
      )
      ),
      map(() => ({ code: 200, message: `LotteryGame with id: ${lotteryGame._id} has been updated` })),
      mergeMap(r => GraphqlResponseTools.buildSuccessResponse$(r)),
      catchError(err => GraphqlResponseTools.handleError$(err))
    );
  }


  /**
   * Edit the lotteryGame state
   */
  updateLotteryGameState$({ root, args, jwt }, authToken) {
    const lotteryGame = {
      _id: args.id,
      state: args.newState,
      modifierUser: authToken.preferred_username,
      modificationTimestamp: new Date().getTime()
    };

    return RoleValidator.checkPermissions$(
      authToken.realm_access.roles,
      "LotteryGame",
      "updateLotteryGameState$",
      PERMISSION_DENIED,
      ["PLATFORM-ADMIN", "LOTTERY-ADMIN"]
    ).pipe(
      mergeMap(() => eventSourcing.eventStore.emitEvent$(
        new Event({
          eventType: "LotteryGameStateUpdated",
          eventTypeVersion: 1,
          aggregateType: "LotteryGame",
          aggregateId: lotteryGame._id,
          data: lotteryGame,
          user: authToken.preferred_username
        })
      )
      ),
      map(() => ({ code: 200, message: `LotteryGame with id: ${lotteryGame._id} has been updated` })),
      mergeMap(r => GraphqlResponseTools.buildSuccessResponse$(r)),
      catchError(err => GraphqlResponseTools.handleError$(err))
    );
  }


  //#endregion


}

/**
 * @returns {LotteryGameCQRS}
 */
module.exports = () => {
  if (!instance) {
    instance = new LotteryGameCQRS();
    console.log(`${instance.constructor.name} Singleton created`);
  }
  return instance;
};
