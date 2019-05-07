'use strict'

const {} = require("rxjs");
const { tap, mergeMap, catchError, map, mapTo } = require('rxjs/operators');
const broker = require("../../tools/broker/BrokerFactory")();
const LotteryDA = require('../../data/LotteryDA');
const MATERIALIZED_VIEW_TOPIC = "emi-gateway-materialized-view-updates";

/**
 * Singleton instance
 */
let instance;

class LotteryES {

    constructor() {
    }


    /**
     * Persists the lottery on the materialized view according to the received data from the event store.
     * @param {*} businessCreatedEvent business created event
     */
    handleLotteryCreated$(lotteryCreatedEvent) {  
        const lottery = lotteryCreatedEvent.data;
        return LotteryDA.createLottery$(lottery)
        .pipe(
            mergeMap(result => broker.send$(MATERIALIZED_VIEW_TOPIC, `LotteryLotteryUpdatedSubscription`, result.ops[0]))
        );
    }

        /**
     * Update the general info on the materialized view according to the received data from the event store.
     * @param {*} lotteryGeneralInfoUpdatedEvent lottery created event
     */
    handleLotteryGeneralInfoUpdated$(lotteryGeneralInfoUpdatedEvent) {  
        const lotteryGeneralInfo = lotteryGeneralInfoUpdatedEvent.data;
        return LotteryDA.updateLotteryGeneralInfo$(lotteryGeneralInfoUpdatedEvent.aid, lotteryGeneralInfo)
        .pipe(
            mergeMap(result => broker.send$(MATERIALIZED_VIEW_TOPIC, `LotteryLotteryUpdatedSubscription`, result))
        );
    }

    /**
     * updates the state on the materialized view according to the received data from the event store.
     * @param {*} LotteryStateUpdatedEvent events that indicates the new state of the lottery
     */
    handleLotteryStateUpdated$(LotteryStateUpdatedEvent) {          
        return LotteryDA.updateLotteryState$(LotteryStateUpdatedEvent.aid, LotteryStateUpdatedEvent.data)
        .pipe(
            mergeMap(result => broker.send$(MATERIALIZED_VIEW_TOPIC, `LotteryLotteryUpdatedSubscription`, result))
        );
    }

}



/**
 * @returns {LotteryES}
 */
module.exports = () => {
    if (!instance) {
        instance = new LotteryES();
        console.log(`${instance.constructor.name} Singleton created`);
    }
    return instance;
};