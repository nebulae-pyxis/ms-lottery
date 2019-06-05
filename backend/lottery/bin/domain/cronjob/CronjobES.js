"use strict";
// RXJS
const { of, interval, forkJoin, from } = require("rxjs");
const { take, mergeMap, catchError, map, toArray, filter, delay, tap } = require("rxjs/operators");
// Data access
const CalendarDA = require("./data-access/LotteryCalendarDA");
const DrawDA = require("./data-access/LotteryDrawDA");
const GameDA = require("./data-access/LotteryGameDA");
const SheetConfigDA = require("./data-access/LotterySheetConfigDA");
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
            eventType: "LotteryCheckDrawsToOpen",
            eventTypeVersion: 1,
            user: "SYSTEM_TEST",
            data: { }
          })
        )
      )
    )
    .subscribe()
  }

  handleLotteryCheckDrawsToOpen$({ aid, data, user, timestamp }) {
    console.log("handleLotteryCheckDrawsToOpen$.....", aid, data, user);
    return CalendarDA.findDrawsToOpen$(timestamp).pipe(
      // tap(x => console.log(x)),
      map(calendars =>
        calendars.map(c => ({
          ...c,
          dateCalendar: c.dateCalendar.filter(
            dateCalendar =>
              dateCalendar.openingDatetime <= timestamp &&
              dateCalendar.closingDatetime > timestamp &&
              !dateCalendar.drawState
          )
        }))
      ),
      mergeMap(calendars => from(calendars)),
      mergeMap(calendar => CronjobESHelper.searchConfigurationToOpenADraw$(calendar))
    );
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
