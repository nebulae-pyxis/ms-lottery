const withFilter = require("graphql-subscriptions").withFilter;
const RoleValidator  = require("../../tools/RoleValidator");
const PubSub = require("graphql-subscriptions").PubSub;
const pubsub = new PubSub();
const broker = require("../../broker/BrokerFactory")();
const CONTEXT_NAME = "sales-gateway";

const { handleError$ } = require('../../tools/GraphqlResponseTools');
const { of } = require('rxjs');
const { map, mergeMap, catchError } = require('rxjs/operators');
const { ApolloError } = require("apollo-server");


// please use the prefix assigned to this microservice
const INTERNAL_SERVER_ERROR_CODE = 16001;
const USERS_PERMISSION_DENIED_ERROR_CODE = 16002;

/**
 * Extracts data of backend response and throw an ApolloError if backend response code is not equal to 200
 * @param {object} response Raw response of backend
 */
function getResponseFromBackEnd$(response) {
  return of(response)
  .pipe(
      map(({result, data}) => {            
          if (result.code != 200 && result.error) {
              throw new ApolloError(result.error.msg, result.code, result.error );
          }
          return data;
      })
  );
}

/**
 * Validate user roles and send request to backend handler
 * @param {object} root root of GraphQl
 * @param {object} OperationArguments arguments for query or mutation
 * @param {object} context graphQl context
 * @param { Array } requiredRoles Roles required to use the query or mutation
 * @param {string} operationType  sample: query || mutation
 * @param {string} aggregateName sample: Vehicle, Client, FixedFile 
 * @param {string} methodName method name
 * @param {number} timeout timeout for query or mutation in milliseconds
 */
function sendToBackEndHandler$(root, OperationArguments, context, requiredRoles, operationType, aggregateName, methodName, timeout = 2000){  
    return RoleValidator.checkPermissions$(
      context.authToken.realm_access.roles,
      CONTEXT_NAME,
      methodName,
      USERS_PERMISSION_DENIED_ERROR_CODE,
      "Permission denied",
      requiredRoles
    )
    .pipe(          
      mergeMap(() =>
        broker.forwardAndGetReply$(
          aggregateName,
          `salesgateway.graphql.${operationType}.${methodName}`,
          { root, args: OperationArguments, jwt: context.encodedToken },
          timeout
        )
      ),          
      catchError(err => handleError$(err, methodName)),
      mergeMap(response => getResponseFromBackEnd$(response))
    )
}

module.exports = {
  Query: {
    lotteryOpenDraws(root, args, context) {
        const requiredRoles = [];
        // return sendToBackEndHandler$(root, args, context, requiredRoles, 'query', 'Client', 'clientDetails')        
        return of([
          { id: '4d8f-9g6t-2w6s', name:'Cruz Roja', openDraws: 
            [
              {id: '1q9r', name: 'Juego 1', number: '1234' },
              {id: '1k4b', name: 'Juego 2', number: '5698' },
              {id: '5d6f', name: 'Juego 3', number: '2589' },
              {id: '8f8y', name: 'Juego 4', number: '1548' },
            ]
          },
          { id: '4q5s-f8g9-g6h5', name:'Cundinamarca', openDraws: 
            [
              {id: '93ei', name: 'Juego 5', number: '3456' },
              {id: '9d6n', name: 'Juego 6', number: '5915' },
              {id: '5a9j', name: 'Juego 7', number: '2659' },
              {id: '2r6p', name: 'Juego 8', number: '8495' },
            ]
          },
        
        ])
        .toPromise();
    },
    lotteryAvailableSeriesForNumber(root, args, context) {
      const requiredRoles = [];     
      return of([
       { series: 'DE45-JI45-KO12', availableTickets: 157 },
       { series: 'J9E3-5G9T-6F9G', availableTickets: 159 },
       { series: '5G8A-1A1S-1E1F', availableTickets: 567 },
       { series: '2Q2W-3E3D-5D9A', availableTickets: 856 },
       { series: '6F6T-9T5G-5D9G', availableTickets: 125 },
       { series: '4D8V-2W8H-Q96F', availableTickets: 598 },      
      ])
      .toPromise();
    },
    lotteries(root, args, context) {
      const requiredRoles = [];     
      return of([
       { id: 'DE45-JI45-KO12', name: 'Quindío' },
       { id: 'J9E3-5G9T-6F9G', name: 'Cundinamarca' },
       { id: '5G8A-1A1S-1E1F', name: 'Cruz Roja' },
       { id: '2Q2W-3E3D-5D9A', name: 'Lotería de Medellín' },
       { id: '6F6T-9T5G-5D9G', name: 'Paisita 1' },
       { id: '4D8V-2W8H-Q96F', name: 'Chontico Día' },      
      ])
      .toPromise();
    },
    lotteryClosedDraws(root, args, context) {
      const requiredRoles = [];     
      return of([
       { id: 'DE45-JI45-KO12', name: 'Quindío', number: '1234' },
       { id: 'J9E3-5G9T-6F9G', name: 'Cundinamarca', number: '3451' },
       { id: '5G8A-1A1S-1E1F', name: 'Cruz Roja', number: '3457' },
       { id: '2Q2W-3E3D-5D9A', name: 'Lotería de Medellín', number: '1974' },
       { id: '6F6T-9T5G-5D9G', name: 'Paisita 1', number: '5834' },
       { id: '4D8V-2W8H-Q96F', name: 'Chontico Día', number: '6934' },      
      ])
      .toPromise();
    },
    lotteryPrizes(root, args, context) {
      const requiredRoles = [];     
      return of([
       {
        ticketNumber: '1QW-2SE-3SD',
        ticketSeries: '123',
        ticketId: '1Q2W-EDRF-E34R',
        prizeId: '1QW3-E334',
        prizeName: 'Premio A1',
        prizeTotal: 580000,
        prizePayment: 5250000,
        prizeClaimed: false 
       },
       {
        ticketNumber: '8fg-f5g-g6f',
        ticketSeries: '569',
        ticketId: '2w3e-d5g7-a1s4',
        prizeId: 'a2d6-sd45',
        prizeName: 'Premio A2',
        prizeTotal: 18000,
        prizePayment: 125000,
        prizeClaimed: false 
       }
      ])
      .toPromise();
    },
    lotterySoldTickets(root, args, context) {
      const requiredRoles = [];     

      return of([
       {
        id: 'q1w2-2we3-r4t5',
        drawId: 'qa09-dd45-nj67',
        ticketNumber: 'B12520',
        ticketSeries: '2345',
        ticketCount: 125,
        clientName: 'Juan Santa',
        clientDocumentId: '1045050988',
        clientPhoneNumber: 3128588812,
        transactionId: 'sw23-de45-fr56',
        terminal: {
          id: 'w2e-2de',
          userId: '158f-69df-58fg-5f7j-69hu',
          userName: 'juan.santa'
        }
       },
       {
        id: '5d8f-9drt-d7c8',
        drawId: 's5f6-dd45-nj67',
        ticketNumber: 'C4582',
        ticketSeries: '6d9f',
        ticketCount: 125,
        clientName: 'Lucas Parra',
        clientDocumentId: '15896588',
        clientPhoneNumber: 3125889988,
        transactionId: 'se45-de45-sd38'
       },
      ])
      .toPromise();
    },
    lotteryBoughtTickets(root, args, context) {
      const requiredRoles = [];     
      return of([
      {
        id: '5d8f-9drt-d7c8',
        drawId: 's5f6-dd45-nj67',
        ticketNumber: 'C4582',
        ticketSeries: '6d9f',
        ticketCount: 125,
        clientName: 'Lucas Parra',
        clientDocumentId: '15896588',
        clientPhoneNumber: 3125889988,
        transactionId: 'se45-de45-sd38'
      },
      {
        id: 'sd34-d5g7-2s3d',
        drawId: 's5f6-dd45-nj67',
        ticketNumber: 'C4582',
        ticketSeries: '6d9f',
        ticketCount: 125,
        clientName: 'Armando Rendon',
        clientDocumentId: '1059865985',
        clientPhoneNumber: 3125248965,
        transactionId: 'se45-de45-sd38'
      },
      ])
      .toPromise();
    },
    lotteryRedeemedPrizes(root, args, context){
      return of([
        {
          ticketNumber: '5698',
          ticketSeries: 'B563',
          ticketId: '1q2w-d4f5-b6b4',
          prizeId: '1qxs-2cfr-45gt-45rf',
          prizeName: 'Premio mayor',
          prizeTotal: 2254000000,
          prizePayment: 974000000,
          prizeClaimed: true,
          terminal: {
            id: 'w2e-2de',
            userId: '158f-69df-58fg-5f7j-69hu',
            userName: 'juan.santa'
          }
        },
        {
          ticketNumber: '5698',
          ticketSeries: 'B563',
          ticketId: '1q2w-d4f5-b6b4',
          prizeId: '1qxs-2cfr-45gt-45rf',
          prizeName: 'Premio mayor',
          prizeTotal: 1254000000,
          prizePayment: 974000000,
          prizeClaimed: true,
          terminal: {
            id: 'w2e-2de',
            userId: '158f-69df-58fg-5f7j-69hu',
            userName: 'juan.santa'
          }
        },
       ])
       .toPromise();
    },
    lotteryClaimedPrizes(root, args, context) {
      const requiredRoles = [];     
      return of([
      {
        ticketNumber: '5698',
        ticketSeries: 'B563',
        ticketId: '1q2w-d4f5-b6b4',
        prizeId: '1qxs-2cfr-45gt-45rf',
        prizeName: 'Premio mayor',
        prizeTotal: 2254000000,
        prizePayment: 974000000,
        prizeClaimed: true,
        terminal: {
          id: 'w2e-2de',
          userId: '158f-69df-58fg-5f7j-69hu',
          userName: 'juan.santa'
        }
      },
      {
        ticketNumber: '5698',
        ticketSeries: 'F2548',
        ticketId: '6f9v-d4f5-b6b4',
        prizeId: '1qxs-6d9g-45gt-45rf',
        prizeName: 'Premio menor',
        prizeTotal: 520000000,
        prizePayment: 325000000,
        prizeClaimed: true,
        terminal: {
          id: 'w2e-2de',
          userId: '158f-69df-58fg-5f7j-69hu',
          userName: 'juan.santa'
        }
      },
    ])
      .toPromise();
    }
  },
  // MUTATIONS //
  Mutation: {
    lotteryBuyTicket(root, args, context) {      
      const requiredRoles = [];     
      return of({
        id: 'l3m5-d9f7-2k0m-j8c8',        
        drawId: args.input.drawId || 'autogen-1qw2-e3r4',
        ticketNumber: args.input.ticketNumber || 'autogen-5986',
        ticketSeries: args.input.ticketSeries || 'autogen-5869',
        ticketCount: args.input.ticketCount || 1,
        clientName: args.input.clientName,
        clientDocumentId: args.input.clientDocumentId,
        clientPhoneNumber: args.input.clientPhoneNumber,
        transactionId: args.input.transactionId,
        terminal: args.input.terminal
      })
      .toPromise();      
    },
    lotteryClaimPrize(root, args, context) {
      const requiredRoles = [];     
      return of({
        ticketNumber: 'qw12-we23-3e4r',
        ticketSeries: 'B123',
        ticketId: 'q1w2-3e4r',
        prizeId: '29iw-38ue',
        prizeName: 'Premio B3',
        prizeTotal: 580000,
        prizePayment: 495000,
        prizeClaimed: true,
        terminal: {
          id: "RS23-FR34-GH67",
          userId: "l30d-5f6g-9h7y",
          userName:"juan.santa"
        }
      })
      .toPromise();      
    },
    lotteryreSendPrizeClaimCode(root, args, context) {
      const requiredRoles = [];
      return of({
        code: 200,
        message: 'Prize claim code was resent to client successful'
      })
      .toPromise();      
    },
  },
  //// SUBSCRIPTIONS ///////
  // Subscription: {
  // }
};

//// SUBSCRIPTIONS SOURCES ////

const eventDescriptors = [
];

/**
 * Connects every backend event to the right GQL subscription
 */
eventDescriptors.forEach(descriptor => {
  broker.getMaterializedViewsUpdates$([descriptor.backendEventName]).subscribe(
    evt => {
      if (descriptor.onEvent) {
        descriptor.onEvent(evt, descriptor);
      }
      const payload = {};
      payload[descriptor.gqlSubscriptionName] = descriptor.dataExtractor
        ? descriptor.dataExtractor(evt)
        : evt.data;
      pubsub.publish(descriptor.gqlSubscriptionName, payload);
    },

    error => {
      if (descriptor.onError) {
        descriptor.onError(error, descriptor);
      }
      console.error(`Error listening ${descriptor.gqlSubscriptionName}`, error);
    },

    () => console.log(`${descriptor.gqlSubscriptionName} listener STOPPED`)
  );
});
