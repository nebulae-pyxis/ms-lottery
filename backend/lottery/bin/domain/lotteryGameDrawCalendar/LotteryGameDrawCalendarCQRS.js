"use strict";

const uuidv4 = require("uuid/v4");
const { of, interval } = require("rxjs");
const Event = require("@nebulae/event-store").Event;
const eventSourcing = require("../../tools/EventSourcing")();
const LotteryGameDrawCalendarDA = require("../../data/LotteryGameDrawCalendarDA");
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

class LotteryGameDrawCalendarCQRS {
  constructor() {
  }

  /**  
   * Gets the LotteryGame
   *
   * @param {*} args args
   */
  getLotteryGameDrawCalendar$({ args }, authToken) {
    return RoleValidator.checkPermissions$(
      authToken.realm_access.roles,
      "LotteryGameDrawCalendar",
      "getLotteryGameDrawCalendar",
      PERMISSION_DENIED,
      ["PLATFORM-ADMIN", "LOTTERY-ADMIN", "LOTTERY-APPROVER"]
    ).pipe(
      mergeMap(roles => {
        const isPlatformAdmin = roles["PLATFORM-ADMIN"];
        //If an user does not have the role to get the LotteryGame from other business, the query must be filtered with the businessId of the user
        const businessId = !isPlatformAdmin ? (authToken.businessId || '') : null;
        return LotteryGameDrawCalendarDA.getLotteryGameDrawCalendar$(args.id)
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
  getLotteryGameDrawCalendarList$({ args }, authToken) {
    return RoleValidator.checkPermissions$(
      authToken.realm_access.roles,
      "LotteryGameDrawCalendar",
      "getLotteryGameDrawCalendarList",
      PERMISSION_DENIED,
      ["PLATFORM-ADMIN", "LOTTERY-ADMIN", "LOTTERY-APPROVER"]
    ).pipe(
      mergeMap(roles => {
        const filterInput = args.filterInput;

        return LotteryGameDrawCalendarDA.getLotteryGameDrawCalendarList$(filterInput);
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
  createLotteryGameDrawCalendar$({ root, args, jwt }, authToken) {
    const lotteryGameDrawCalendar = args ? args.input : undefined;
    lotteryGameDrawCalendar._id = uuidv4();
    lotteryGameDrawCalendar.creationUsername = authToken.preferred_username;
    lotteryGameDrawCalendar.creationUserid = authToken.userid;
    lotteryGameDrawCalendar.creationTimestamp = new Date().getTime();
    lotteryGameDrawCalendar.editionUsername = authToken.preferred_username;
    lotteryGameDrawCalendar.editionUserId = authToken.userId;
    lotteryGameDrawCalendar.editionTimestamp = new Date().getTime();
    return RoleValidator.checkPermissions$(
      authToken.realm_access.roles,
      "LotteryGameDrawCalendar",
      "createLotteryGameDrawCalendar$",
      PERMISSION_DENIED,
      ["PLATFORM-ADMIN", "LOTTERY-ADMIN"]
    ).pipe(
      mergeMap(() => eventSourcing.eventStore.emitEvent$(
        new Event({
          eventType: "LotteryGameDrawCalendarCreated",
          eventTypeVersion: 1,
          aggregateType: "LotteryGameDrawCalendar",
          aggregateId: lotteryGameDrawCalendar._id,
          data: lotteryGameDrawCalendar,
          user: authToken.preferred_username
        }))
      ),
      map(() => ({ code: 200, message: `LotteryGameDrawCalendar with id: ${lotteryGameDrawCalendar._id} has been created` })),
      mergeMap(r => GraphqlResponseTools.buildSuccessResponse$(r)),
      catchError(err => GraphqlResponseTools.handleError$(err))
    );
  }

  /**
  * Edit the lotteryGame state
  */
  updateLotteryGameDrawCalendar$({ root, args, jwt }, authToken) {
    const lotteryGameDrawCalendar = {
      ...args.input, _id: args.id,
      approved: 'PENDING',
      editionUserId: authToken.user_id,
      editionUsername: authToken.preferred_username,
      editionTimestamp: new Date().getTime()
    };
    return RoleValidator.checkPermissions$(
      authToken.realm_access.roles,
      "LotteryGameDrawCalendar",
      "updateLotteryGameDrawCalendar$",
      PERMISSION_DENIED,
      ["PLATFORM-ADMIN", "LOTTERY-ADMIN"]
    ).pipe(
      mergeMap(() => eventSourcing.eventStore.emitEvent$(
        new Event({
          eventType: "LotteryGameDrawCalendarUpdated",
          eventTypeVersion: 1,
          aggregateType: "LotteryGameDrawCalendar",
          aggregateId: lotteryGameDrawCalendar._id,
          data: lotteryGameDrawCalendar,
          user: authToken.preferred_username
        })
      )
      ),
      map(() => ({ code: 200, message: `LotteryGameDrawCalendar with id: ${lotteryGameDrawCalendar._id} has been updated` })),
      mergeMap(r => GraphqlResponseTools.buildSuccessResponse$(r)),
      catchError(err => GraphqlResponseTools.handleError$(err))
    );
  }


  /**
   * Edit the lotteryGame state
   */
  approveLotteryGameDrawCalendar$({ root, args, jwt }, authToken) {
    const lotteryGameDrawCalendar = {
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
      "LotteryGameDrawCalendar",
      "approveLotteryGameDrawCalendar$",
      PERMISSION_DENIED,
      ["PLATFORM-ADMIN", "LOTTERY-APPROVER"]
    ).pipe(
      mergeMap(() => eventSourcing.eventStore.emitEvent$(
        new Event({
          eventType: "LotteryGameDrawCalendarApproved",
          eventTypeVersion: 1,
          aggregateType: "LotteryGameDrawCalendar",
          aggregateId: lotteryGameDrawCalendar.id,
          data: lotteryGameDrawCalendar,
          user: authToken.preferred_username
        })
      )
      ),
      map(() => ({ code: 200, message: `LotteryGameDrawCalendar with id: ${lotteryGameDrawCalendar._id} has been updated` })),
      mergeMap(r => GraphqlResponseTools.buildSuccessResponse$(r)),
      catchError(err => GraphqlResponseTools.handleError$(err))
    );
  }

  /**
   * Edit the lotteryGame state
   */
  revokeLotteryGameDrawCalendar$({ root, args, jwt }, authToken) {
    const lotteryGameDrawCalendar = {
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
      "LotteryGameDrawCalendar",
      "revokeLotteryGameDrawCalendar$",
      PERMISSION_DENIED,
      ["PLATFORM-ADMIN", "LOTTERY-APPROVER"]
    ).pipe(
      mergeMap(() => eventSourcing.eventStore.emitEvent$(
        new Event({
          eventType: "LotteryGameDrawCalendarRevoked",
          eventTypeVersion: 1,
          aggregateType: "LotteryGameDrawCalendar",
          aggregateId: lotteryGameDrawCalendar.id,
          data: lotteryGameDrawCalendar,
          user: authToken.preferred_username
        })
      )
      ),
      map(() => ({ code: 200, message: `LotteryGameDrawCalendar with id: ${lotteryGameDrawCalendar._id} has been updated` })),
      mergeMap(r => GraphqlResponseTools.buildSuccessResponse$(r)),
      catchError(err => GraphqlResponseTools.handleError$(err))
    );
  }




  //#endregion


}

/**
 * @returns {LotteryGameDrawCalendarCQRS}
 */
module.exports = () => {
  if (!instance) {
    instance = new LotteryGameDrawCalendarCQRS();
    console.log(`${instance.constructor.name} Singleton created`);
  }
  return instance;
};
