"use strict";

const { LotteryCQRS } = require("../../domain/lottery");
const { LotteryGameCQRS } = require("../../domain/lotterygame");
const { LotteryGameSheetConfigCQRS } = require("../../domain/lotteryGameSheetConfig");
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
      }
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
      }
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
