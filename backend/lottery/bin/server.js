'use strict'

if (process.env.NODE_ENV !== 'production') {
    require('dotenv').load();
}

const eventSourcing = require('./tools/EventSourcing')();
const eventStoreService = require('./services/event-store/EventStoreService')();
const mongoDB = require('./data/MongoDB').singleton();
const LotteryDA = require('./data/LotteryDA');
const LotteryGameDA = require('./data/LotteryGameDA');
const LotteryGameSheetConfigDA = require('./data/LotteryGameSheetConfigDA');
const LotteryGameDrawCalendarDA = require('./data/LotteryGameDrawCalendarDA');
const LotteryGamePrizeProgramDA = require('./data/LotteryGamePrizeProgramDA');
const LotteryDraw = require('./domain/lotteryDraw');
const graphQlService = require('./services/emi-gateway/GraphQlService')();
const Rx = require('rxjs');

const start = () => {
    Rx.concat(
        eventSourcing.eventStore.start$(),
        eventStoreService.start$(),
        mongoDB.start$(),
        LotteryDA.start$(),
        LotteryGameDA.start$(),
        LotteryGameSheetConfigDA.start$(),
        LotteryGamePrizeProgramDA.start$(),
        LotteryGameDrawCalendarDA.start$(),
        LotteryDraw.start$,
        graphQlService.start$()
    ).subscribe(
        (evt) => {
            // console.log(evt)
        },
        (error) => {
            console.error('Failed to start', error);
            process.exit(1);
        },
        () => console.log('lottery started')
    );
};

start();



