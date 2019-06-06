"use strict";
const { of, from, concat } = require("rxjs");
const eventSourcing = require("../../tools/EventSourcing")();
const { LotteryES } = require("../../domain/lottery");
const { LotteryGameES } = require("../../domain/lotterygame");
const { CronjobES } = require("../../domain/cronjob");
const { LotteryGameSheetConfigES } = require("../../domain/lotteryGameSheetConfig");
const { LotteryGameQuotaES } = require("../../domain/lotteryGameQuota");
const { LotteryGamePrizeProgramES } = require("../../domain/lotteryGamePrizeProgram");
const { LotteryGameDrawCalendarES } = require("../../domain/lotteryGameDrawCalendar");
const { LotteryDrawES } = require("../../domain/lotteryDraw");
const { map, switchMap, filter, mergeMap, concatMap } = require('rxjs/operators');
/**
 * Singleton instance
 */
let instance;
/**
 * Micro-BackEnd key
 */
const mbeKey = "ms-lottery_mbe_lottery";

class EventStoreService {
  constructor() {
    this.functionMap = this.generateFunctionMap();
    this.subscriptions = [];
    this.aggregateEventsArray = this.generateAggregateEventsArray();
  }

  /**
   * Starts listening to the EventStore
   * Returns observable that resolves to each subscribe agregate/event
   *    emit value: { aggregateType, eventType, handlerName}
   */
  start$() {
    //default error handler
    const onErrorHandler = error => {
      console.error("Error handling  EventStore incoming event", error);
      process.exit(1);
    };
    //default onComplete handler
    const onCompleteHandler = () => {
      () => console.log("EventStore incoming event subscription completed");
    };
    console.log("EventStoreService starting ...");

    return from(this.aggregateEventsArray).pipe(
      map(aggregateEvent => ({ ...aggregateEvent, onErrorHandler, onCompleteHandler })),
      map(params => this.subscribeEventHandler(params))
    );      
  }

  /**
   * Stops listening to the Event store
   * Returns observable that resolves to each unsubscribed subscription as string
   */
  stop$() {
    return from(this.subscriptions).pipe(
      map(subscription => {
        subscription.subscription.unsubscribe();
        return `Unsubscribed: aggregateType=${aggregateType}, eventType=${eventType}, handlerName=${handlerName}`;
      })
    );
  }

  /**
     * Create a subscrition to the event store and returns the subscription info     
     * @param {{aggregateType, eventType, onErrorHandler, onCompleteHandler}} params
     * @return { aggregateType, eventType, handlerName  }
     */
  subscribeEventHandler({ aggregateType, eventType, onErrorHandler, onCompleteHandler }) {    
    const handler = this.functionMap[eventType];
    const subscription =
      //MANDATORY:  AVOIDS ACK REGISTRY DUPLICATIONS
      eventSourcing.eventStore.ensureAcknowledgeRegistry$(aggregateType,mbeKey).pipe(
        mergeMap(() => eventSourcing.eventStore.getEventListener$(aggregateType, mbeKey, false)),
        filter(evt => evt.et === eventType),
        mergeMap(evt => concat(
          handler.fn.call(handler.obj, evt),
          //MANDATORY:  ACKWOWLEDGE THIS EVENT WAS PROCESSED
          eventSourcing.eventStore.acknowledgeEvent$(evt, mbeKey),
        ))
      )
        .subscribe(
          (evt) => {
            // console.log(`EventStoreService: ${eventType} process: ${evt}`);
          },
          onErrorHandler,
          onCompleteHandler
      );
    this.subscriptions.push({ aggregateType, eventType, handlerName: handler.fn.name, subscription });
    return { aggregateType, eventType, handlerName: `${handler.obj.name}.${handler.fn.name}` };
  }

  /**
  * Starts listening to the EventStore
  * Returns observable that resolves to each subscribe agregate/event
  *    emit value: { aggregateType, eventType, handlerName}
  */
  syncState$() {
    return from(this.aggregateEventsArray).pipe(
      concatMap(params => this.subscribeEventRetrieval$(params))
    )
  }


  /**
   * Create a subscrition to the event store and returns the subscription info     
   * @param {{aggregateType, eventType, onErrorHandler, onCompleteHandler}} params
   * @return { aggregateType, eventType, handlerName  }
   */
  subscribeEventRetrieval$({ aggregateType, eventType }) {
    const handler = this.functionMap[eventType];
    //MANDATORY:  AVOIDS ACK REGISTRY DUPLICATIONS
    return eventSourcing.eventStore.ensureAcknowledgeRegistry$(aggregateType,mbeKey).pipe(
      switchMap(() => eventSourcing.eventStore.retrieveUnacknowledgedEvents$(aggregateType, mbeKey)),
      filter(evt => evt.et === eventType),
      concatMap(evt => concat(
        handler.fn.call(handler.obj, evt),
        //MANDATORY:  ACKWOWLEDGE THIS EVENT WAS PROCESSED
        eventSourcing.eventStore.acknowledgeEvent$(evt, mbeKey)
      ))
    );
  }

  ////////////////////////////////////////////////////////////////////////////////////////
  /////////////////// CONFIG SECTION, ASSOC EVENTS AND PROCESSORS BELOW     //////////////
  ////////////////////////////////////////////////////////////////////////////////////////

  generateFunctionMap() {
    return {
      //LOTTERY
      LotteryCreated: {
        fn: LotteryES.handleLotteryCreated$,
        obj: LotteryES
      },
      LotteryGeneralInfoUpdated: {
        fn: LotteryES.handleLotteryGeneralInfoUpdated$,
        obj: LotteryES
      },
      LotteryStateUpdated: {
        fn: LotteryES.handleLotteryStateUpdated$,
        obj: LotteryES
      },
      //GAME
      LotteryGameCreated: {
        fn: LotteryGameES.handleLotteryGameCreated$,
        obj: LotteryGameES
      },
      LotteryGameGeneralInfoUpdated: {
        fn: LotteryGameES.handleLotteryGameGeneralInfoUpdated$,
        obj: LotteryGameES
      },
      LotteryGameStateUpdated: {
        fn: LotteryGameES.handleLotteryGameStateUpdated$,
        obj: LotteryGameES
      },
      //SHEET CONFIG
      LotteryGameSheetConfigCreated: {
        fn: LotteryGameSheetConfigES.handleLotteryGameSheetConfigCreated$,
        obj: LotteryGameSheetConfigES
      },
      LotteryGameSheetConfigUpdated: {
        fn: LotteryGameSheetConfigES.handleLotteryGameSheetConfigUpdated$,
        obj: LotteryGameSheetConfigES
      },
      LotteryGameSheetConfigApproved: {
        fn: LotteryGameSheetConfigES.handleLotteryGameSheetConfigApproved$,
        obj: LotteryGameSheetConfigES
      },
      LotteryGameSheetConfigRevoked: {
        fn: LotteryGameSheetConfigES.handleLotteryGameSheetConfigRevoked$,
        obj: LotteryGameSheetConfigES
      },
      //PRIZE PROGRAM
      LotteryGamePrizeProgramCreated: {
        fn: LotteryGamePrizeProgramES.handleLotteryGamePrizeProgramCreated$,
        obj: LotteryGamePrizeProgramES
      },
      LotteryGamePrizeProgramUpdated: {
        fn: LotteryGamePrizeProgramES.handleLotteryGamePrizeProgramUpdated$,
        obj: LotteryGamePrizeProgramES
      },
      LotteryGamePrizeProgramApproved: {
        fn: LotteryGamePrizeProgramES.handleLotteryGamePrizeProgramApproved$,
        obj: LotteryGamePrizeProgramES
      },
      LotteryGamePrizeProgramRevoked: {
        fn: LotteryGamePrizeProgramES.handleLotteryGamePrizeProgramRevoked$,
        obj: LotteryGamePrizeProgramES
      },
      // DRAW CALENDAR
      LotteryGameDrawCalendarCreated: {
        fn: LotteryGameDrawCalendarES.handleLotteryGameDrawCalendarCreated$,
        obj: LotteryGameDrawCalendarES
      },
      LotteryGameDrawCalendarUpdated: {
        fn: LotteryGameDrawCalendarES.handleLotteryGameDrawCalendarUpdated$,
        obj: LotteryGameDrawCalendarES
      },
      LotteryGameDrawCalendarApproved: {
        fn: LotteryGameDrawCalendarES.handleLotteryGameDrawCalendarApproved$,
        obj: LotteryGameDrawCalendarES
      },
      LotteryGameDrawCalendarRevoked: {
        fn: LotteryGameDrawCalendarES.handleLotteryGameDrawCalendarRevoked$,
        obj: LotteryGameDrawCalendarES
      },
      // CRONJOB
      LotteryCheckDrawsToUpdateState: {
        fn: CronjobES.handleLotteryCheckDrawsToUpdateState$,
        obj: CronjobES
      },
      // QUOTA
      LotteryGameQuotaCreated: {
        fn: LotteryGameQuotaES.handleLotteryGameQuotaCreated$,
        obj: LotteryGameQuotaES
      },
      LotteryGameQuotaUpdated: {
        fn: LotteryGameQuotaES.handleLotteryGameQuotaUpdated$,
        obj: LotteryGameQuotaES
      },
      LotteryGameQuotaApproved: {
        fn: LotteryGameQuotaES.handleLotteryGameQuotaApproved$,
        obj: LotteryGameQuotaES
      },
      LotteryGameQuotaRevoked: {
        fn: LotteryGameQuotaES.handleLotteryGameQuotaRevoked$,
        obj: LotteryGameQuotaES
      },
      // QUOTA NUMBER
      LotteryGameQuotaNumberCreated: {
        fn: LotteryGameQuotaES.handleLotteryGameQuotaNumberCreated$,
        obj: LotteryGameQuotaES
      },
      LotteryGameQuotaNumberRemoved: {
        fn: LotteryGameQuotaES.handleLotteryGameQuotaNumberRemoved$,
        obj: LotteryGameQuotaES
      },
      // LOTTERY DRAW
      LotteryDrawStateUpdated: {
        fn: LotteryDrawES.handleLotteryDrawStateUpdated$,
        obj: LotteryDrawES
      }
    };
  }

  /**
  * Generates a map that assocs each AggretateType withs its events
  */
  generateAggregateEventsArray() {
    return [
      // LOTTERY
      {
        aggregateType: "Lottery",
        eventType: "LotteryCreated"
      },
      {
        aggregateType: "Lottery",
        eventType: "LotteryGeneralInfoUpdated"
      },
      {
        aggregateType: "Lottery",
        eventType: "LotteryStateUpdated"
      },
      //GAME
      {
        aggregateType: "LotteryGame",
        eventType: "LotteryGameCreated"
      },
      {
        aggregateType: "LotteryGame",
        eventType: "LotteryGameGeneralInfoUpdated"
      },
      {
        aggregateType: "LotteryGame",
        eventType: "LotteryGameStateUpdated"
      },
      //SHEET CONFIG
      {
        aggregateType: "LotteryGameSheetConfig",
        eventType: "LotteryGameSheetConfigCreated"
      },
      {
        aggregateType: "LotteryGameSheetConfig",
        eventType: "LotteryGameSheetConfigUpdated"
      },
      {
        aggregateType: "LotteryGameSheetConfig",
        eventType: "LotteryGameSheetConfigApproved"
      },
      {
        aggregateType: "LotteryGameSheetConfig",
        eventType: "LotteryGameSheetConfigRevoked"
      },
      //PRIZE PROGRAM
      {
        aggregateType: "LotteryGamePrizeProgram",
        eventType: "LotteryGamePrizeProgramCreated"
      },
      {
        aggregateType: "LotteryGamePrizeProgram",
        eventType: "LotteryGamePrizeProgramUpdated"
      },
      {
        aggregateType: "LotteryGamePrizeProgram",
        eventType: "LotteryGamePrizeProgramApproved"
      },
      {
        aggregateType: "LotteryGamePrizeProgram",
        eventType: "LotteryGamePrizeProgramRevoked"
      },
      // DRAW CALENDAR
      {
        aggregateType: "LotteryGameDrawCalendar",
        eventType: "LotteryGameDrawCalendarCreated"
      },
      {
        aggregateType: "LotteryGameDrawCalendar",
        eventType: "LotteryGameDrawCalendarUpdated"
      },
      {
        aggregateType: "LotteryGameDrawCalendar",
        eventType: "LotteryGameDrawCalendarApproved"
      },
      {
        aggregateType: "LotteryGameDrawCalendar",
        eventType: "LotteryGameDrawCalendarRevoked"
      },
      {
        aggregateType: "Cronjob",
        eventType: "LotteryCheckDrawsToUpdateState"
      },
      // QUOTA
      {
        aggregateType: "LotteryGameQuota",
        eventType: "LotteryGameQuotaCreated"
      },
      {
        aggregateType: "LotteryGameQuota",
        eventType: "LotteryGameQuotaUpdated"
      },
      {
        aggregateType: "LotteryGameQuota",
        eventType: "LotteryGameQuotaApproved"
      },
      {
        aggregateType: "LotteryGameQuota",
        eventType: "LotteryGameQuotaRevoked"
      },
      // QUOTA NUMBER
      {
        aggregateType: "LotteryGameQuota",
        eventType: "LotteryGameQuotaNumberCreated"
      },
      {
        aggregateType: "LotteryGameQuota",
        eventType: "LotteryGameQuotaNumberRemoved"
      },
      // LOTTERY DRAW
      {
        aggregateType: "LotteryDraw",
        eventType: "LotteryDrawStateUpdated"
      }
    ]
  }
}

/**
 * @returns {EventStoreService}
 */
module.exports = () => {
  if (!instance) {
    instance = new EventStoreService();
    console.log("NEW  EventStore instance  !!");
  }
  return instance;
};

