"use strict";

const { LotteryCQRS } = require("../../domain/lottery");
const { LotteryGameCQRS } = require("../../domain/lotterygame");
const { LotteryGameSheetConfigCQRS } = require("../../domain/lotteryGameSheetConfig");
const { LotteryGameQuotaCQRS } = require("../../domain/lotteryGameQuota");
const { LotteryGamePrizeProgramCQRS } = require("../../domain/lotteryGamePrizeProgram");
const { LotteryGameDrawCalendarCQRS } = require("../../domain/lotteryGameDrawCalendar");
const { LotteryDrawCQRS } =require("../../domain/lotteryDraw");
const broker = require("../../tools/broker/BrokerFactory")();
const { of, from } = require("rxjs");
const jsonwebtoken = require("jsonwebtoken");
const { map, mergeMap, catchError, tap } = require('rxjs/operators');
const jwtPublicKey = process.env.JWT_PUBLIC_KEY.replace(/\\n/g, "\n");
const {handleError$} = require('../../tools/GraphqlResponseTools');


let instance;

class GraphQlService {


  constructor() {
    this.functionMap = this.generateFunctionMap();
    this.subscriptions = [];
  }

  /**
   * Starts GraphQL actions listener
   */
  start$() {
      //default on error handler
      const onErrorHandler = (error) => {
        console.error("Error handling  GraphQl incoming event", error);
        process.exit(1);
      };
  
      //default onComplete handler
      const onCompleteHandler = () => {
        () => console.log("GraphQlService incoming event subscription completed");
      };
    return from(this.getSubscriptionDescriptors()).pipe(
      map(aggregateEvent => ({ ...aggregateEvent, onErrorHandler, onCompleteHandler })),
      map(params => this.subscribeEventHandler(params))
    )
  }

  /**
   * build a Broker listener to handle GraphQL requests procesor
   * @param {*} descriptor 
   */
  subscribeEventHandler({
    aggregateType,
    messageType,
    onErrorHandler,
    onCompleteHandler
  }) {
    const handler = this.functionMap[messageType];
    const subscription = broker
      .getMessageListener$([aggregateType], [messageType]).pipe(
        mergeMap(message => this.verifyRequest$(message)),
        mergeMap(request => ( request.failedValidations.length > 0)
          ? of(request.errorResponse)
          : of(request).pipe(
              //ROUTE MESSAGE TO RESOLVER
              mergeMap(({ authToken, message }) =>
              handler.fn
                .call(handler.obj, message.data, authToken).pipe(
                  map(response => ({ response, correlationId: message.id, replyTo: message.attributes.replyTo }))
                )
            )
          )
        )    
        ,mergeMap(msg => this.sendResponseBack$(msg))
      )
      .subscribe(
        msg => { /* console.log(`GraphQlService: ${messageType} process: ${msg}`); */ },
        onErrorHandler,
        onCompleteHandler
      );
    this.subscriptions.push({
      aggregateType,
      messageType,
      handlerName: handler.fn.name,
      subscription
    });
    return {
      aggregateType,
      messageType,
      handlerName: `${handler.obj.name}.${handler.fn.name}`
    };
  }

    /**
   * Verify the message if the request is valid.
   * @param {any} request request message
   * @returns { Rx.Observable< []{request: any, failedValidations: [] }>}  Observable object that containg the original request and the failed validations
   */
  verifyRequest$(request) {
    return of(request).pipe(
      //decode and verify the jwt token
      mergeMap(message =>
        of(message).pipe(
          map(message => ({ authToken: jsonwebtoken.verify(message.data.jwt, jwtPublicKey), message, failedValidations: [] })),
          catchError(err =>
            handleError$(err).pipe(
              map(response => ({
                errorResponse: { response, correlationId: message.id, replyTo: message.attributes.replyTo },
                failedValidations: ['JWT']
              }
              ))
            )
          )
        )
      )
    )
  }

 /**
  * 
  * @param {any} msg Object with data necessary  to send response
  */
 sendResponseBack$(msg) {
   return of(msg).pipe(mergeMap(
    ({ response, correlationId, replyTo }) =>
      replyTo
        ? broker.send$(replyTo, "emigateway.graphql.Query.response", response, {
            correlationId
          })
        : of(undefined)
  ));
}

  stop$() {
    from(this.subscriptions).pipe(
      map(subscription => {
        subscription.subscription.unsubscribe();
        return `Unsubscribed: aggregateType=${aggregateType}, eventType=${eventType}, handlerName=${handlerName}`;
      })
    );
  }

  ////////////////////////////////////////////////////////////////////////////////////////
  /////////////////// CONFIG SECTION, ASSOC EVENTS AND PROCESSORS BELOW  /////////////////
  ////////////////////////////////////////////////////////////////////////////////////////


  /**
   * returns an array of broker subscriptions for listening to GraphQL requests
   */
  getSubscriptionDescriptors() {
    console.log("GraphQl Service starting ...");
    return [
      // LOTTERY
      {
        aggregateType: "Lottery",
        messageType: "emigateway.graphql.query.LotteryLotteries"
      },
      {
        aggregateType: "Lottery",
        messageType: "emigateway.graphql.query.LotteryLotteriesSize"
      },
      {
        aggregateType: "Lottery",
        messageType: "emigateway.graphql.query.LotteryLottery"
      },
      {
        aggregateType: "Lottery",
        messageType: "emigateway.graphql.mutation.LotteryCreateLottery"
      },
      {
        aggregateType: "Lottery",
        messageType: "emigateway.graphql.mutation.LotteryUpdateLotteryGeneralInfo"
      },
      {
        aggregateType: "Lottery",
        messageType: "emigateway.graphql.mutation.LotteryUpdateLotteryState"
      },
      //GAME
      {
        aggregateType: "LotteryGame",
        messageType: "emigateway.graphql.query.LotteryGames"
      },
      {
        aggregateType: "LotteryGame",
        messageType: "emigateway.graphql.query.LotteryGamesSize"
      },
      {
        aggregateType: "LotteryGame",
        messageType: "emigateway.graphql.query.LotteryGame"
      },
      {
        aggregateType: "LotteryGame",
        messageType: "emigateway.graphql.mutation.LotteryCreateLotteryGame"
      },
      {
        aggregateType: "LotteryGame",
        messageType: "emigateway.graphql.mutation.LotteryUpdateLotteryGameGeneralInfo"
      },
      {
        aggregateType: "LotteryGame",
        messageType: "emigateway.graphql.mutation.LotteryUpdateLotteryGameState"
      },
      //SHEET CONFIG
      {
        aggregateType: "LotteryGameSheetConfig",
        messageType: "emigateway.graphql.query.LotteryGameSheetConfig"
      },
      {
        aggregateType: "LotteryGameSheetConfig",
        messageType: "emigateway.graphql.query.LotteryGameSheetConfigList"
      },
      {
        aggregateType: "LotteryGameSheetConfig",
        messageType: "emigateway.graphql.mutation.CreateLotteryGameSheetConfig"
      },
      {
        aggregateType: "LotteryGameSheetConfig",
        messageType: "emigateway.graphql.mutation.UpdateLotteryGameSheetConfig"
      },
      {
        aggregateType: "LotteryGameSheetConfig",
        messageType: "emigateway.graphql.mutation.ApproveLotteryGameSheetConfig"
      },
      {
        aggregateType: "LotteryGameSheetConfig",
        messageType: "emigateway.graphql.mutation.RevokeLotteryGameSheetConfig"
      },
      //PRIZE PROGRAM
      {
        aggregateType: "LotteryGamePrizeProgram",
        messageType: "emigateway.graphql.query.LotteryGamePrizeProgram"
      },
      {
        aggregateType: "LotteryGamePrizeProgram",
        messageType: "emigateway.graphql.query.LotteryGamePrizeProgramList"
      },
      {
        aggregateType: "LotteryGamePrizeProgram",
        messageType: "emigateway.graphql.mutation.CreateLotteryGamePrizeProgram"
      },
      {
        aggregateType: "LotteryGamePrizeProgram",
        messageType: "emigateway.graphql.mutation.UpdateLotteryGamePrizeProgram"
      },
      {
        aggregateType: "LotteryGamePrizeProgram",
        messageType: "emigateway.graphql.mutation.ApproveLotteryGamePrizeProgram"
      },
      {
        aggregateType: "LotteryGamePrizeProgram",
        messageType: "emigateway.graphql.mutation.RevokeLotteryGamePrizeProgram"
      },
      // DRAW CALENDAR
      {
        aggregateType: "LotteryGameDrawCalendar",
        messageType: "emigateway.graphql.query.LotteryGameDrawCalendar"
      },
      {
        aggregateType: "LotteryGameDrawCalendar",
        messageType: "emigateway.graphql.query.LotteryGameDrawCalendarList"
      },
      {
        aggregateType: "LotteryGameDrawCalendar",
        messageType: "emigateway.graphql.mutation.CreateLotteryGameDrawCalendar"
      },
      {
        aggregateType: "LotteryGameDrawCalendar",
        messageType: "emigateway.graphql.mutation.UpdateLotteryGameDrawCalendar"
      },
      {
        aggregateType: "LotteryGameDrawCalendar",
        messageType: "emigateway.graphql.mutation.ApproveLotteryGameDrawCalendar"
      },
      {
        aggregateType: "LotteryGameDrawCalendar",
        messageType: "emigateway.graphql.mutation.RevokeLotteryGameDrawCalendar"
      },
      // QUOTA
      {
        aggregateType: "LotteryGameQuota",
        messageType: "emigateway.graphql.query.LotteryGameQuota"
      },
      {
        aggregateType: "LotteryGameQuota",
        messageType: "emigateway.graphql.query.LotteryGameQuotaList"
      },
      {
        aggregateType: "LotteryGameQuota",
        messageType: "emigateway.graphql.mutation.CreateLotteryGameQuota"
      },
      {
        aggregateType: "LotteryGameQuota",
        messageType: "emigateway.graphql.mutation.UpdateLotteryGameQuota"
      },
      {
        aggregateType: "LotteryGameQuota",
        messageType: "emigateway.graphql.mutation.ApproveLotteryGameQuota"
      },
      {
        aggregateType: "LotteryGameQuota",
        messageType: "emigateway.graphql.mutation.RevokeLotteryGameQuota"
      },
      // QUOTA NUMBER
      {
        aggregateType: "LotteryGameQuota",
        messageType: "emigateway.graphql.query.LotteryGameQuotaNumberList"
      },
      {
        aggregateType: "LotteryGameQuota",
        messageType: "emigateway.graphql.query.LotteryGameQuotaNumberListSize"
      },
      {
        aggregateType: "LotteryGameQuota",
        messageType: "emigateway.graphql.mutation.CreateLotteryGameQuotaNumber"
      },
      {
        aggregateType: "LotteryGameQuota",
        messageType: "emigateway.graphql.mutation.RemoveLotteryGameQuotaNumber"
      },
      // LOTTERY DRAW
      {
        aggregateType: "Lottery",
        messageType: "emigateway.graphql.query.lotteryLoteryOptions"
      },
      {
        aggregateType: "Lottery",
        messageType: "emigateway.graphql.query.lotteryDraws"
      },
      {
        aggregateType: "Lottery",
        messageType: "emigateway.graphql.query.lotteryDrawsSize"
      },
      {
        aggregateType: "Lottery",
        messageType: "emigateway.graphql.query.lotteryDrawConfirmResults"
      },
      {
        aggregateType: "Lottery",
        messageType: "emigateway.graphql.query.lotteryDrawApproveResults"
      },
    ];
  }
  /**
   * returns a map that assocs GraphQL request with its processor
   */
  generateFunctionMap() {    
    return {
      // LOTTERY
      "emigateway.graphql.query.LotteryLotteries": {
        fn: LotteryCQRS.getLotteryList$,
        obj: LotteryCQRS
      },
      "emigateway.graphql.query.LotteryLotteriesSize": {
        fn: LotteryCQRS.getLotteryListSize$,
        obj: LotteryCQRS
      },
      "emigateway.graphql.query.LotteryLottery": {
        fn: LotteryCQRS.getLottery$,
        obj: LotteryCQRS
      },
      "emigateway.graphql.mutation.LotteryCreateLottery": {
        fn: LotteryCQRS.createLottery$,
        obj: LotteryCQRS
      }, 
      "emigateway.graphql.mutation.LotteryUpdateLotteryGeneralInfo": {
        fn: LotteryCQRS.updateLotteryGeneralInfo$,
        obj: LotteryCQRS
      },
      "emigateway.graphql.mutation.LotteryUpdateLotteryState": {
        fn: LotteryCQRS.updateLotteryState$,
        obj: LotteryCQRS
      },
      // GAME 
      "emigateway.graphql.query.LotteryGames": {
        fn: LotteryGameCQRS.getLotteryGameList$,
        obj: LotteryGameCQRS
      },
      "emigateway.graphql.query.LotteryGamesSize": {
        fn: LotteryGameCQRS.getLotteryGameListSize$,
        obj: LotteryGameCQRS
      },
      "emigateway.graphql.query.LotteryGame": {
        fn: LotteryGameCQRS.getLotteryGame$,
        obj: LotteryGameCQRS
      },
      "emigateway.graphql.mutation.LotteryCreateLotteryGame": {
        fn: LotteryGameCQRS.createLotteryGame$,
        obj: LotteryGameCQRS
      }, 
      "emigateway.graphql.mutation.LotteryUpdateLotteryGameGeneralInfo": {
        fn: LotteryGameCQRS.updateLotteryGameGeneralInfo$,
        obj: LotteryGameCQRS
      },
      "emigateway.graphql.mutation.LotteryUpdateLotteryGameState": {
        fn: LotteryGameCQRS.updateLotteryGameState$,
        obj: LotteryGameCQRS
      },
      //SHEET CONFIG
      "emigateway.graphql.query.LotteryGameSheetConfig": {
        fn: LotteryGameSheetConfigCQRS.getLotteryGameSheetConfig$,
        obj: LotteryGameSheetConfigCQRS
      },
      "emigateway.graphql.query.LotteryGameSheetConfigList": {
        fn: LotteryGameSheetConfigCQRS.getLotteryGameSheetConfigList$,
        obj: LotteryGameSheetConfigCQRS
      },
      "emigateway.graphql.mutation.CreateLotteryGameSheetConfig": {
        fn: LotteryGameSheetConfigCQRS.createLotteryGameSheetConfig$,
        obj: LotteryGameSheetConfigCQRS
      },
      "emigateway.graphql.mutation.UpdateLotteryGameSheetConfig": {
        fn: LotteryGameSheetConfigCQRS.updateLotteryGameSheetConfig$,
        obj: LotteryGameSheetConfigCQRS
      },
      "emigateway.graphql.mutation.ApproveLotteryGameSheetConfig": {
        fn: LotteryGameSheetConfigCQRS.approveLotteryGameSheetConfig$,
        obj: LotteryGameSheetConfigCQRS
      },
      "emigateway.graphql.mutation.RevokeLotteryGameSheetConfig": {
        fn: LotteryGameSheetConfigCQRS.revokeLotteryGameSheetConfig$,
        obj: LotteryGameSheetConfigCQRS
      },
      //PRIZE PROGRAM
      "emigateway.graphql.query.LotteryGamePrizeProgram": {
        fn: LotteryGamePrizeProgramCQRS.getLotteryGamePrizeProgram$,
        obj: LotteryGamePrizeProgramCQRS
      },
      "emigateway.graphql.query.LotteryGamePrizeProgramList": {
        fn: LotteryGamePrizeProgramCQRS.getLotteryGamePrizeProgramList$,
        obj: LotteryGamePrizeProgramCQRS
      },
      "emigateway.graphql.mutation.CreateLotteryGamePrizeProgram": {
        fn: LotteryGamePrizeProgramCQRS.createLotteryGamePrizeProgram$,
        obj: LotteryGamePrizeProgramCQRS
      },
      "emigateway.graphql.mutation.UpdateLotteryGamePrizeProgram": {
        fn: LotteryGamePrizeProgramCQRS.updateLotteryGamePrizeProgram$,
        obj: LotteryGamePrizeProgramCQRS
      },
      "emigateway.graphql.mutation.ApproveLotteryGamePrizeProgram": {
        fn: LotteryGamePrizeProgramCQRS.approveLotteryGamePrizeProgram$,
        obj: LotteryGamePrizeProgramCQRS
      },
      "emigateway.graphql.mutation.RevokeLotteryGamePrizeProgram": {
        fn: LotteryGamePrizeProgramCQRS.revokeLotteryGamePrizeProgram$,
        obj: LotteryGamePrizeProgramCQRS
      },
      // DRAW CALENDAR
      "emigateway.graphql.query.LotteryGameDrawCalendar": {
        fn: LotteryGameDrawCalendarCQRS.getLotteryGameDrawCalendar$,
        obj: LotteryGameDrawCalendarCQRS
      },
      "emigateway.graphql.query.LotteryGameDrawCalendarList": {
        fn: LotteryGameDrawCalendarCQRS.getLotteryGameDrawCalendarList$,
        obj: LotteryGameDrawCalendarCQRS
      },
      "emigateway.graphql.mutation.CreateLotteryGameDrawCalendar": {
        fn: LotteryGameDrawCalendarCQRS.createLotteryGameDrawCalendar$,
        obj: LotteryGameDrawCalendarCQRS
      },
      "emigateway.graphql.mutation.UpdateLotteryGameDrawCalendar": {
        fn: LotteryGameDrawCalendarCQRS.updateLotteryGameDrawCalendar$,
        obj: LotteryGameDrawCalendarCQRS
      },
      "emigateway.graphql.mutation.ApproveLotteryGameDrawCalendar": {
        fn: LotteryGameDrawCalendarCQRS.approveLotteryGameDrawCalendar$,
        obj: LotteryGameDrawCalendarCQRS
      },
      "emigateway.graphql.mutation.RevokeLotteryGameDrawCalendar": {
        fn: LotteryGameDrawCalendarCQRS.revokeLotteryGameDrawCalendar$,
        obj: LotteryGameDrawCalendarCQRS
      },
      // QUOTA
      "emigateway.graphql.query.LotteryGameQuota": {
        fn: LotteryGameQuotaCQRS.getLotteryGameQuota$,
        obj: LotteryGameQuotaCQRS
      },
      "emigateway.graphql.query.LotteryGameQuotaList": {
        fn: LotteryGameQuotaCQRS.getLotteryGameQuotaList$,
        obj: LotteryGameQuotaCQRS
      },
      "emigateway.graphql.mutation.CreateLotteryGameQuota": {
        fn: LotteryGameQuotaCQRS.createLotteryGameQuota$,
        obj: LotteryGameQuotaCQRS
      },
      "emigateway.graphql.mutation.UpdateLotteryGameQuota": {
        fn: LotteryGameQuotaCQRS.updateLotteryGameQuota$,
        obj: LotteryGameQuotaCQRS
      },
      "emigateway.graphql.mutation.ApproveLotteryGameQuota": {
        fn: LotteryGameQuotaCQRS.approveLotteryGameQuota$,
        obj: LotteryGameQuotaCQRS
      },
      "emigateway.graphql.mutation.RevokeLotteryGameQuota": {
        fn: LotteryGameQuotaCQRS.revokeLotteryGameQuota$,
        obj: LotteryGameQuotaCQRS
      },
      // QUOTA NUMBER
      "emigateway.graphql.mutation.CreateLotteryGameQuotaNumber": {
        fn: LotteryGameQuotaCQRS.createLotteryGameQuotaNumber$,
        obj: LotteryGameQuotaCQRS
      },
      "emigateway.graphql.mutation.RemoveLotteryGameQuotaNumber": {
        fn: LotteryGameQuotaCQRS.removeLotteryGameQuotaNumber$,
        obj: LotteryGameQuotaCQRS
      },
      "emigateway.graphql.query.LotteryGameQuotaNumberListSize": {
        fn: LotteryGameQuotaCQRS.getLotteryGameQuotaNumberListSize$,
        obj: LotteryGameQuotaCQRS
      },
      "emigateway.graphql.query.LotteryGameQuotaNumberList": {
        fn: LotteryGameQuotaCQRS.getLotteryGameQuotaNumberList$,
        obj: LotteryGameQuotaCQRS
      },
      // LOTTERY DRAW
      "emigateway.graphql.query.lotteryLoteryOptions": {
        fn: LotteryDrawCQRS.lotteryLoteryOptions$,
        obj: LotteryDrawCQRS
      },
      "emigateway.graphql.query.lotteryDraws":{
        fn: LotteryDrawCQRS.lotteryDraws$,
        obj: LotteryDrawCQRS
      },
      "emigateway.graphql.query.lotteryDrawsSize":{
        fn: LotteryDrawCQRS.lotteryDrawsSize$,
        obj: LotteryDrawCQRS
      },
      "emigateway.graphql.query.lotteryDrawConfirmResults": {
        fn: LotteryDrawCQRS.lotteryDrawConfirmResults$,
        obj: LotteryDrawCQRS
      },
      "emigateway.graphql.query.lotteryDrawApproveResults": {
        fn: LotteryDrawCQRS.lotteryDrawApproveResults$,
        obj: LotteryDrawCQRS
      },

    };
  }
}

/**
 * @returns {GraphQlService}
 */
module.exports = () => {
  if (!instance) {
    instance = new GraphQlService();
    console.log(`${instance.constructor.name} Singleton created`);
  }
  return instance;
};
