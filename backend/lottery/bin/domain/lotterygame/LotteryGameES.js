'use strict'

const {} = require("rxjs");
const { tap, mergeMap, catchError, map, mapTo } = require('rxjs/operators');
const broker = require("../../tools/broker/BrokerFactory")();
const LotteryGameDA = require('../../data/LotteryGameDA');
const MATERIALIZED_VIEW_TOPIC = "emi-gateway-materialized-view-updates";

/**
 * Singleton instance
 */
let instance;

class LotteryGameES {

    constructor() {
    }


    /**
     * Persists the lotteryGame on the materialized view according to the received data from the event store.
     * @param {*} businessCreatedEvent business created event
     */
    handleLotteryGameCreated$(lotteryGameCreatedEvent) {  
        const lotteryGame = lotteryGameCreatedEvent.data;
        return LotteryGameDA.createLotteryGame$(lotteryGame)
        .pipe(
            mergeMap(result => broker.send$(MATERIALIZED_VIEW_TOPIC, `LotteryGameUpdatedSubscription`, result.ops[0]))
        );
    }

        /**
     * Update the general info on the materialized view according to the received data from the event store.
     * @param {*} lotteryGameGeneralInfoUpdatedEvent lotteryGame created event
     */
    handleLotteryGameGeneralInfoUpdated$(lotteryGameGeneralInfoUpdatedEvent) {  
        const lotteryGameGeneralInfo = lotteryGameGeneralInfoUpdatedEvent.data;
        return LotteryGameDA.updateLotteryGameGeneralInfo$(lotteryGameGeneralInfoUpdatedEvent.aid, lotteryGameGeneralInfo)
        .pipe(
            mergeMap(result => broker.send$(MATERIALIZED_VIEW_TOPIC, `LotteryGameUpdatedSubscription`, result))
        );
    }

    /**
     * updates the state on the materialized view according to the received data from the event store.
     * @param {*} LotteryGameStateUpdatedEvent events that indicates the new state of the lotteryGame
     */
    handleLotteryGameStateUpdated$(LotteryGameStateUpdatedEvent) {          
        return LotteryGameDA.updateLotteryGameState$(LotteryGameStateUpdatedEvent.aid, LotteryGameStateUpdatedEvent.data)
        .pipe(
            mergeMap(result => broker.send$(MATERIALIZED_VIEW_TOPIC, `LotteryGameUpdatedSubscription`, result))
        );
    }

}



/**
 * @returns {LotteryGameES}
 */
module.exports = () => {
    if (!instance) {
        instance = new LotteryGameES();
        console.log(`${instance.constructor.name} Singleton created`);
    }
    return instance;
};