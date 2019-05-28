'use strict'

const {} = require("rxjs");
const { tap, mergeMap, catchError, map, mapTo } = require('rxjs/operators');
const broker = require("../../tools/broker/BrokerFactory")();
const LotteryGamePrizeProgramDA = require('../../data/LotteryGamePrizeProgramDA');
const MATERIALIZED_VIEW_TOPIC = "emi-gateway-materialized-view-updates";

/**
 * Singleton instance
 */
let instance;

class LotteryGamePrizeProgramES {

    constructor() {
    }


    /**
     * Persists the lotteryGame on the materialized view according to the received data from the event store.
     * @param {*} businessCreatedEvent business created event
     */
    handleLotteryGamePrizeProgramCreated$(lotteryGamePrizeProgramCreatedEvent) {  
        const lotteryGamePrizeProgram = lotteryGamePrizeProgramCreatedEvent.data;
        return LotteryGamePrizeProgramDA.createLotteryGamePrizeProgram$(lotteryGamePrizeProgram)
        .pipe(
            mergeMap(result => broker.send$(MATERIALIZED_VIEW_TOPIC, `LotteryGamePrizeProgramUpdatedSubscription`, result.ops[0]))
        );
    }

        /**
     * Update the general info on the materialized view according to the received data from the event store.
     * @param {*} lotteryGameGeneralInfoUpdatedEvent lotteryGame created event
     */
    handleLotteryGamePrizeProgramUpdated$(lotteryGamePrizeProgramUpdatedEvent) {  
        const lotteryGamePrizeProgram = lotteryGamePrizeProgramUpdatedEvent.data;
        return LotteryGamePrizeProgramDA.updateLotteryGamePrizeProgram$(lotteryGamePrizeProgramUpdatedEvent.aid, lotteryGamePrizeProgram)
        .pipe(
            mergeMap(result => broker.send$(MATERIALIZED_VIEW_TOPIC, `LotteryGamePrizeProgramUpdatedSubscription`, result))
        );
    }

    /**
     * updates the state on the materialized view according to the received data from the event store.
     * @param {*} LotteryGameStateUpdatedEvent events that indicates the new state of the lotteryGame
     */
    handleLotteryGamePrizeProgramApproved$(LotteryGamePrizeProgramApprovedEvent) {      
        return LotteryGamePrizeProgramDA.approveLotteryGamePrizeProgram$(LotteryGamePrizeProgramApprovedEvent.data)
        .pipe(
            mergeMap(result => broker.send$(MATERIALIZED_VIEW_TOPIC, `LotteryGamePrizeProgramUpdatedSubscription`, result))
        );
    }

    /**
     * updates the state on the materialized view according to the received data from the event store.
     * @param {*} LotteryGameStateUpdatedEvent events that indicates the new state of the lotteryGame
     */
    handleLotteryGamePrizeProgramRevoked$(LotteryGamePrizeProgramRevokedEvent) {          
        return LotteryGamePrizeProgramDA.revokeLotteryGamePrizeProgram$(LotteryGamePrizeProgramRevokedEvent.data)
        .pipe(
            mergeMap(result => broker.send$(MATERIALIZED_VIEW_TOPIC, `LotteryGamePrizeProgramUpdatedSubscription`, result))
        );
    }

}



/**
 * @returns {LotteryGamePrizeProgramES}
 */
module.exports = () => {
    if (!instance) {
        instance = new LotteryGamePrizeProgramES();
        console.log(`${instance.constructor.name} Singleton created`);
    }
    return instance;
};