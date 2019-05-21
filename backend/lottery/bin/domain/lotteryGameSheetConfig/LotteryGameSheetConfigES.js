'use strict'

const {} = require("rxjs");
const { tap, mergeMap, catchError, map, mapTo } = require('rxjs/operators');
const broker = require("../../tools/broker/BrokerFactory")();
const LotteryGameSheetConfigDA = require('../../data/LotteryGameSheetConfigDA');
const MATERIALIZED_VIEW_TOPIC = "emi-gateway-materialized-view-updates";

/**
 * Singleton instance
 */
let instance;

class LotteryGameSheetConfigES {

    constructor() {
    }


    /**
     * Persists the lotteryGame on the materialized view according to the received data from the event store.
     * @param {*} businessCreatedEvent business created event
     */
    handleLotteryGameSheetConfigCreated$(lotteryGameSheetConfigCreatedEvent) {  
        const lotteryGameSheetConfig = lotteryGameSheetConfigCreatedEvent.data;
        return LotteryGameSheetConfigDA.createLotteryGameSheetConfig$(lotteryGameSheetConfig)
        .pipe(
            mergeMap(result => broker.send$(MATERIALIZED_VIEW_TOPIC, `LotteryGameSheetConfigUpdatedSubscription`, result.ops[0]))
        );
    }

        /**
     * Update the general info on the materialized view according to the received data from the event store.
     * @param {*} lotteryGameGeneralInfoUpdatedEvent lotteryGame created event
     */
    handleLotteryGameSheetConfigUpdated$(lotteryGameSheetConfigUpdatedEvent) {  
        const lotteryGameSheetConfig = lotteryGameSheetConfigUpdatedEvent.data;
        return LotteryGameSheetConfigDA.updateLotteryGameSheetConfig$(lotteryGameSheetConfigUpdatedEvent.aid, lotteryGameSheetConfig)
        .pipe(
            mergeMap(result => broker.send$(MATERIALIZED_VIEW_TOPIC, `LotteryGameSheetConfigUpdatedSubscription`, result))
        );
    }

    /**
     * updates the state on the materialized view according to the received data from the event store.
     * @param {*} LotteryGameStateUpdatedEvent events that indicates the new state of the lotteryGame
     */
    handleLotteryGameSheetConfigApproved$(LotteryGameSheetConfigApprovedEvent) {      
        return LotteryGameSheetConfigDA.approveLotteryGameSheetConfig$(LotteryGameSheetConfigApprovedEvent.data)
        .pipe(
            mergeMap(result => broker.send$(MATERIALIZED_VIEW_TOPIC, `LotteryGameSheetConfigUpdatedSubscription`, result))
        );
    }

    /**
     * updates the state on the materialized view according to the received data from the event store.
     * @param {*} LotteryGameStateUpdatedEvent events that indicates the new state of the lotteryGame
     */
    handleLotteryGameSheetConfigRevoked$(LotteryGameSheetConfigRevokedEvent) {          
        return LotteryGameSheetConfigDA.revokeLotteryGameSheetConfig$(LotteryGameSheetConfigRevokedEvent.data)
        .pipe(
            mergeMap(result => broker.send$(MATERIALIZED_VIEW_TOPIC, `LotteryGameSheetConfigUpdatedSubscription`, result))
        );
    }

}



/**
 * @returns {LotteryGameSheetConfigES}
 */
module.exports = () => {
    if (!instance) {
        instance = new LotteryGameSheetConfigES();
        console.log(`${instance.constructor.name} Singleton created`);
    }
    return instance;
};