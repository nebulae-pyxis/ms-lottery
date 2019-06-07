'use strict'


const { of, interval, forkJoin } = require("rxjs");
const { take, mergeMap, catchError, map, toArray, filter, tap } = require('rxjs/operators');

const broker = require("../../tools/broker/BrokerFactory")();
const Crosscutting = require('../../tools/Crosscutting');
const { Event } = require("@nebulae/event-store");
const eventSourcing = require("../../tools/EventSourcing")();

// DATA ACCESS
const { LotteryDrawDA, LotteryCalendarDA } = require('./data-access')

/**
 * Singleton instance
 */
let instance;

class LotteryDrawES {

    constructor() {
    }

    handleLotteryDrawStateUpdated$({aid, data, user, timestamp}){
        const { state, draw } = data;
        const { drawCalendarId } = draw;
        console.log("handleLotteryDrawStateUpdated$", {aid, data, user, timestamp});
        return of(state)
        .pipe(
            mergeMap(() => state == "OPEN" 
                ? LotteryDrawDA.insertOne$(draw)
                : LotteryDrawDA.updateState$(aid, state)
            ),
            mergeMap(() => LotteryCalendarDA.updateDrawStateInCalendar$(drawCalendarId, draw._id, state)),
            tap(r => console.log(r.result))
        )
    }

}

/**
 * @returns {LotteryDrawES}
 */
module.exports = () => {
    if (!instance) {
        instance = new LotteryDrawES();
        console.log(`${instance.constructor.name} Singleton created`);
    }
    return instance;
};