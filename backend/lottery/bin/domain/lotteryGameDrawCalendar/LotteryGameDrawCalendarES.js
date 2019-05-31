'use strict'

const {} = require("rxjs");
const { tap, mergeMap, catchError, map, mapTo } = require('rxjs/operators');
const broker = require("../../tools/broker/BrokerFactory")();
const LotteryGameDrawCalendarDA = require('../../data/LotteryGameDrawCalendarDA');
const MATERIALIZED_VIEW_TOPIC = "emi-gateway-materialized-view-updates";

/**
 * Singleton instance
 */
let instance;

class LotteryGameDrawCalendarES {

    constructor() {
    }


    /**
     * Persists the lotteryGame on the materialized view according to the received data from the event store.
     * @param {*} businessCreatedEvent business created event
     */
    handleLotteryGameDrawCalendarCreated$(lotteryGameDrawCalendarCreatedEvent) {  
        const lotteryGameDrawCalendar = lotteryGameDrawCalendarCreatedEvent.data;
        return LotteryGameDrawCalendarDA.createLotteryGameDrawCalendar$(lotteryGameDrawCalendar)
        .pipe(
            mergeMap(result => broker.send$(MATERIALIZED_VIEW_TOPIC, `LotteryGameDrawCalendarUpdatedSubscription`, result.ops[0]))
        );
    }

        /**
     * Update the general info on the materialized view according to the received data from the event store.
     * @param {*} lotteryGameGeneralInfoUpdatedEvent lotteryGame created event
     */
    handleLotteryGameDrawCalendarUpdated$(lotteryGameDrawCalendarUpdatedEvent) {  
        const lotteryGameDrawCalendar = lotteryGameDrawCalendarUpdatedEvent.data;
        return LotteryGameDrawCalendarDA.updateLotteryGameDrawCalendar$(lotteryGameDrawCalendarUpdatedEvent.aid, lotteryGameDrawCalendar)
        .pipe(
            mergeMap(result => broker.send$(MATERIALIZED_VIEW_TOPIC, `LotteryGameDrawCalendarUpdatedSubscription`, result))
        );
    }

    /**
     * updates the state on the materialized view according to the received data from the event store.
     * @param {*} LotteryGameStateUpdatedEvent events that indicates the new state of the lotteryGame
     */
    handleLotteryGameDrawCalendarApproved$(LotteryGameDrawCalendarApprovedEvent) {      
        return LotteryGameDrawCalendarDA.approveLotteryGameDrawCalendar$(LotteryGameDrawCalendarApprovedEvent.data)
        .pipe(
            mergeMap(result => broker.send$(MATERIALIZED_VIEW_TOPIC, `LotteryGameDrawCalendarUpdatedSubscription`, result))
        );
    }

    /**
     * updates the state on the materialized view according to the received data from the event store.
     * @param {*} LotteryGameStateUpdatedEvent events that indicates the new state of the lotteryGame
     */
    handleLotteryGameDrawCalendarRevoked$(LotteryGameDrawCalendarRevokedEvent) {          
        return LotteryGameDrawCalendarDA.revokeLotteryGameDrawCalendar$(LotteryGameDrawCalendarRevokedEvent.data)
        .pipe(
            mergeMap(result => broker.send$(MATERIALIZED_VIEW_TOPIC, `LotteryGameDrawCalendarUpdatedSubscription`, result))
        );
    }

}



/**
 * @returns {LotteryGameDrawCalendarES}
 */
module.exports = () => {
    if (!instance) {
        instance = new LotteryGameDrawCalendarES();
        console.log(`${instance.constructor.name} Singleton created`);
    }
    return instance;
};