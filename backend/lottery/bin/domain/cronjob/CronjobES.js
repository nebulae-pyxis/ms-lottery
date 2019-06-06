"use strict";
// RXJS
const { of, interval, forkJoin, from, concat } = require("rxjs");
const { take, mergeMap, catchError, map, toArray, filter, delay, tap } = require("rxjs/operators");
// Data access
const { LotteryCalendarDA, LotteryDrawDA, LotteryGameDA,
  LotteryPrizeProgramDA, LotteryQuotaDA, LotterySheetConfigDA,
  LotteryDA
} = require("./data-access");

//Tools
const broker = require("../../tools/broker/BrokerFactory")();
const Crosscutting = require("../../tools/Crosscutting");
const { Event } = require("@nebulae/event-store");
const eventSourcing = require("../../tools/EventSourcing")();
//helpers
const CronjobESHelper = require("./CronjobESHelper");

/**
 * Singleton instance
 */
let instance;

class CronjobES {
  constructor() {
    of({}).pipe(
      delay(3000),      
      mergeMap(({ _id }) =>
        eventSourcing.eventStore.emitEvent$(
          new Event({
            aggregateType: "Cronjob",
            aggregateId: '1qw2-e3r4-4r3e-2w1r',
            eventType: "LotteryCheckDrawsToUpdateState",
            eventTypeVersion: 1,
            user: "SYSTEM_TEST",
            data: { }
          })
        )
      )
    )
    .subscribe()
  }

  handleLotteryCheckDrawsToUpdateState$({ timestamp }){
    return concat(
      this.checkDrawsToOpen$( timestamp),
      this.checkDrawsToClose$(timestamp),
      this.checkDrawsToExpire$(timestamp)
    )
  }

  checkDrawsToOpen$(timestamp) {
    return LotteryDA.findActiveLotteries$().pipe(
      mergeMap(lotteries => from(lotteries)),
      mergeMap(lottery => LotteryGameDA.findActiveByLotteryId$(lottery._id)),
      mergeMap(games => from(games)),
      tap(game => console.log(`CHECKING DRAWS TO OPEND FOR: [${game.generalInfo.name}] GAME ` )),
      map(game => game._id),
      mergeMap(gameId => LotteryCalendarDA.findCalendarWithDrawsToOpen$(timestamp, gameId)),
      tap(x => console.log("<<<", x, ">>>")),
      
      /**
       * calendars.map(c => ({
          ...c,
          dateCalendar: c.dateCalendar.filter(
            dateCalendar =>
              dateCalendar.openingDatetime <= timestamp &&
              dateCalendar.closingDatetime > timestamp &&
              !dateCalendar.drawState
          )
        }))
       */


    );



     
      // mergeMap(calendars => from(calendars)),
      // mergeMap(calendar => CronjobESHelper.searchConfigurationToOpenADraw$(calendar))
  }

  checkDrawsToClose$(timestamp){
    return of(timestamp)
  }

  checkDrawsToExpire$(timestamp){
    return of(timestamp)
  }

  // handleDriverBlockAdded$({ aid, data, user }) {
  //     console.log("handleDriverBlockAdded$", aid, data, user);
  //     return ShiftDA.findOpenShiftByDriver$(aid, { _id: 1 })
  //         .pipe(
  //             filter(shift => shift),
  //             mergeMap(({ _id }) => eventSourcing.eventStore.emitEvent$(
  //                 this.buildShiftDriverBlockAddedEsEvent(_id, { key: data.blockKey, notes: data.notes, startTime: undefined, endTime: data.endTime }, user))
  //             ), //Build and send ShiftDriverBlockAdded event (event-sourcing)
  //         );
  // }
  // //#region Object builders

  // /**
  //  * Builds a Event-Sourcing Event of type ShiftDriverBlockAdded
  //  * @param {*} shiftId
  //  * @returns {Event}
  //  */
  // buildShiftDriverBlockAddedEsEvent(shiftId, block, user = 'SYSTEM') {
  //     return new Event({
  //         aggregateType: 'Shift',
  //         aggregateId: shiftId,
  //         eventType: 'ShiftDriverBlockAdded',
  //         eventTypeVersion: 1,
  //         user,
  //         data: {block}
  //     });
  // }

  //#endregion
}

/**
 * @returns {CronjobES}
 */
module.exports = () => {
  if (!instance) {
    instance = new CronjobES();
    console.log(`${instance.constructor.name} Singleton created`);
  }
  return instance;
};
