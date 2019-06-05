'use strict'

const { } = require("rxjs");
const { tap, mergeMap, catchError, map, mapTo } = require('rxjs/operators');
const broker = require("../../tools/broker/BrokerFactory")();
const LotteryGameQuotaDA = require('../../data/LotteryGameQuotaDA');
const LotteryGameQuotaNumberDA = require('../../data/LotteryGameQuotaNumberDA');
const MATERIALIZED_VIEW_TOPIC = "emi-gateway-materialized-view-updates";

/**
 * Singleton instance
 */
let instance;

class LotteryGameQuotaES {

    constructor() {
    }


    /**
     * Persists the lotteryGame on the materialized view according to the received data from the event store.
     * @param {*} businessCreatedEvent business created event
     */
    handleLotteryGameQuotaCreated$(lotteryGameQuotaCreatedEvent) {
        const lotteryGameQuota = lotteryGameQuotaCreatedEvent.data;
        return LotteryGameQuotaDA.createLotteryGameQuota$(lotteryGameQuota)
            .pipe(
                mergeMap(result => broker.send$(MATERIALIZED_VIEW_TOPIC, `LotteryGameQuotaUpdatedSubscription`, result.ops[0]))
            );
    }

    /**
 * Update the general info on the materialized view according to the received data from the event store.
 * @param {*} lotteryGameGeneralInfoUpdatedEvent lotteryGame created event
 */
    handleLotteryGameQuotaUpdated$(lotteryGameQuotaUpdatedEvent) {
        const lotteryGameQuota = lotteryGameQuotaUpdatedEvent.data;
        return LotteryGameQuotaDA.updateLotteryGameQuota$(lotteryGameQuotaUpdatedEvent.aid, lotteryGameQuota)
            .pipe(
                mergeMap(result => broker.send$(MATERIALIZED_VIEW_TOPIC, `LotteryGameQuotaUpdatedSubscription`, result))
            );
    }

    /**
     * updates the state on the materialized view according to the received data from the event store.
     * @param {*} LotteryGameStateUpdatedEvent events that indicates the new state of the lotteryGame
     */
    handleLotteryGameQuotaApproved$(LotteryGameQuotaApprovedEvent) {
        return LotteryGameQuotaDA.approveLotteryGameQuota$(LotteryGameQuotaApprovedEvent.data)
            .pipe(
                mergeMap(result => broker.send$(MATERIALIZED_VIEW_TOPIC, `LotteryGameQuotaUpdatedSubscription`, result))
            );
    }

    /**
     * updates the state on the materialized view according to the received data from the event store.
     * @param {*} LotteryGameStateUpdatedEvent events that indicates the new state of the lotteryGame
     */
    handleLotteryGameQuotaRevoked$(LotteryGameQuotaRevokedEvent) {
        return LotteryGameQuotaDA.revokeLotteryGameQuota$(LotteryGameQuotaRevokedEvent.data)
            .pipe(
                mergeMap(result => broker.send$(MATERIALIZED_VIEW_TOPIC, `LotteryGameQuotaUpdatedSubscription`, result))
            );
    }

    /**
     * updates the state on the materialized view according to the received data from the event store.
     * @param {*} LotteryGameStateUpdatedEvent events that indicates the new state of the lotteryGame
     */
    handleLotteryGameQuotaNumberCreated$(LotteryGameQuotaNumberCreatedEvent) {
        return LotteryGameQuotaNumberDA.createLotteryGameQuotaNumber$(LotteryGameQuotaNumberCreatedEvent.data)
            .pipe(
                mapTo({completed: true, action: 'CREATE'}),
                mergeMap(result => broker.send$(MATERIALIZED_VIEW_TOPIC, `LotteryGameQuotaNumberUpdatedSubscription`, result))
            );
    }

    handleLotteryGameQuotaNumberRemoved$(LotteryGameQuotaNumberRemovedEvent) {
        return LotteryGameQuotaNumberDA.removeLotteryGameQuotaNumberByQuotaId$(LotteryGameQuotaNumberRemovedEvent.data)
            .pipe(
                mapTo({completed: true, action: 'REMOVE'}),
                mergeMap(result => broker.send$(MATERIALIZED_VIEW_TOPIC, `LotteryGameQuotaNumberUpdatedSubscription`, result))
            );
    }

}



/**
 * @returns {LotteryGameQuotaES}
 */
module.exports = () => {
    if (!instance) {
        instance = new LotteryGameQuotaES();
        console.log(`${instance.constructor.name} Singleton created`);
    }
    return instance;
};