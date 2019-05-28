const withFilter = require("graphql-subscriptions").withFilter;
const RoleValidator  = require("../../tools/RoleValidator");
const PubSub = require("graphql-subscriptions").PubSub;
const pubsub = new PubSub();
const broker = require("../../broker/BrokerFactory")();
const CONTEXT_NAME = "sales-gateway";
const uuidv4 = require('uuid/v4');

const { handleError$ } = require('../../tools/GraphqlResponseTools');
const { of, from, forkJoin } = require('rxjs');
const { map, mergeMap, catchError, toArray, filter, tap, take, skip, groupBy, distinct } = require('rxjs/operators');
const { ApolloError } = require("apollo-server");


// please use the prefix assigned to this microservice
const INTERNAL_SERVER_ERROR_CODE = 16001;
const USERS_PERMISSION_DENIED_ERROR_CODE = 16002;

function createCustonError(name, method, code = INTERNAL_SERVER_ERROR_CODE, message = ''){
  const customError = new Error(message);
  customError.code = code;
  customError.name = name;
  customError.method = method;
  return customError;

}

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
 * example: sendToBackEndHandler$(root, args, context, requiredRoles, 'query', 'Client', 'clientDetails')  
 * @param {object} root root of GraphQl
 * @param {object} OperationArguments arguments for query or mutation
 * @param {object} context graphQl context
 * @param { Array } requiredRoles Roles required to use the query or mutation
 * @param {string} operationType  sample: query || mutation
 * @param {string} aggregateName sample: Vehicle, Client, FixedFile 
 * @param {string} methodName method name
 * @param {number} timeout timeout for query or mutation in milliseconds
 * 
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
        console.log('Query => lotteryOpenDraws', {args});
        return of(fakeDB.lotteries)
          .pipe(
            mergeMap(loteries => from(loteries)),
            map(lottery => ({ ...lottery, openDraws: lottery.draws.filter(draw => draw.open )}) ),
            filter(lottery => (lottery.openDraws && lottery.openDraws.length > 0)),
            toArray()
          )
          .toPromise();
    },
    lotteryAvailableNumberSeries(root, args, context) {

      const INVALID_DRAW_ID = createCustonError('Invalid Draw Id', `lotteryAvailableNumberSeries`, 10100, 'El Sorteo no existe');
      const NOT_ACTIVE_DRAW = createCustonError('Not active draw', `lotteryAvailableNumberSeries`, 10101, 'El sorteo no está activo');
      const INVALID_NUMBER = createCustonError('Invalid Number', `lotteryAvailableNumberSeries`, 10102, 'El Número es inválido');

      console.log('Query => lotteryAvailableNumberSeries', {args});
      const { drawId, number } = args;
      return from(fakeDB.lotteries)
      .pipe(
        map(lottery => lottery.draws.find(draw => draw.id == drawId)),
        toArray(),
        map(results => {
          const result = results.filter(e => e);          
          if(result.length === 0){ throw INVALID_DRAW_ID }
          else if(result.length === 1 && !result[0].open){ throw NOT_ACTIVE_DRAW  }
          else if(result.length === 1 &&  !result[0].series.find(s => s.number == number) ){ throw INVALID_NUMBER; }
          else { return result[0].series.filter(serie => serie.number == number); }
        }),
        mergeMap(series => from(series)),
        toArray(),
      )
      .toPromise();
    },
    lotteriesWithOpenDraws(root, args, context) {
      console.log('Query => lotteriesOpenDraws', {args});
      return from(fakeDB.lotteries)
      .pipe(
        filter(lottery => (lottery.draws.filter(draw => draw.open)).length > 0 ),
        toArray()
      )
      .toPromise();
    },
    lotteryClosedDraws(root, args, context) {
      console.log('Query => lotteryClosedDraws', {args});
      const INVALID_LOTTERY_ID = createCustonError('Invalid lottery Id', `lotteryClosedDraws`, 10103, 'La lotería no existe');;
      const { lotteryId } = args;
      return from(fakeDB.lotteries)
      .pipe(
        map(() => fakeDB.lotteries.find(lottery => lottery.id === lotteryId ) ),
        tap(lottery => {
          if(!lottery){ throw INVALID_LOTTERY_ID }
        }),
        map(lottery => lottery.draws.filter(draw => !draw.open))
      )
      .toPromise();
    },
    lotteryPrizesToClaim(root, args, context) {
      console.log('Query => lotteryPrizesToClaim', { args });
      const { drawId, documentId, claimCode } = args;

      const INVALID_LOTTERY_ID = createCustonError('Invalid draw Id', `lotteryPrizesToClaim`, 10103, 'La lotería no existe');
      const INVALID_DOCUMENT_ID = createCustonError('Document Id not found', `lotteryPrizesToClaim`, 10104, 'El documento no fue encontrado');
      const INVALID_CLAIM_CODE = createCustonError('Invalid claim code', `lotteryPrizesToClaim`, 10105, 'El codigo de reclamacion no es valido');

      return of(fakeDB.prizes)
      .pipe(
        map(prizesList => {
          if(!prizesList.find(p => p.drawId === drawId)){ throw INVALID_LOTTERY_ID }
          if(!prizesList.find(p => (p.drawId == drawId && p.documentId == documentId ))){ throw INVALID_DOCUMENT_ID }
          if(claimCode && !prizesList.find(p => (p.drawId == drawId && p.documentId == documentId && p.claimCode == claimCode ))){
            throw INVALID_CLAIM_CODE;
          }
          return prizesList;
        }),
        mergeMap(list => from(list)),
        filter(prize => !prize.prizeClaimed),
        filter(prize => prize.drawId == drawId),
        filter(prize => documentId ?  prize.documentId == documentId : true),
        filter(prize => claimCode ?  prize.claimCode == claimCode : true),
        toArray(),
        map(prizes => prizes ? prizes : [] )
      )
      .toPromise();
    },
    lotterySoldTickets(root, args, context) {
      console.log('Query => lotterySoldTickets', args );
      const INVALID_DRAW_ID = createCustonError('Invalid draw Id', `lotterySoldTickets`, 10100, 'La lotería no existe');
      const INVALID_PAGINATION = createCustonError('Invalid pagination', `lotterySoldTickets`, 10106, 'La paginacion no es correcta');
      const { transactionId, drawId, fromTimestamp, toTimestamp, page = 0, pageSize=10, terminal } = args.input;
      return of(fakeDB.tickets)
      .pipe(
        tap(tickets => {
          if(drawId && !tickets.find(t => t.drawId == drawId)){ throw INVALID_DRAW_ID }
          if(page < 0 || pageSize < 0){ throw INVALID_PAGINATION }
        }),
        mergeMap(tickets => from(tickets)),
        filter(ticket => ticket.timestamp > fromTimestamp),
        filter(ticket => toTimestamp ? ticket.timestamp < toTimestamp : true),        
        filter(ticket => (transactionId && transactionId !== '') ? ticket.transactionId === transactionId : true),
        filter(ticket => (drawId && drawId !== '') ? ticket.drawId === drawId : true),
        filter(ticket => (terminal||{}).id ? ( (ticket.terminal || {}).id === terminal.id) : true),
        filter(ticket => (terminal||{}).userId ? ( (ticket.terminal || {}).userId === terminal.userId) : true),
        filter(ticket => (terminal||{}).userName ? ( (ticket.terminal || {}).userName === terminal.userName) : true),
        skip( page * pageSize ),
        take(pageSize),
        toArray()
      )
      .toPromise();
    },
    lotteryBoughtTickets(root, args, context) {
      console.log('Query => lotteryBoughtTickets', args );
      const DOCUMENT_ID_REQUIRED = createCustonError('Document Id Required', `lotterySoldTickets`, 10107, 'El documento del cliente es requerido');
      const INVALID_DRAW_ID = createCustonError('Draw Id not found', `lotterySoldTickets`, 10100, 'El sorteo no existe');
      const { drawId, documentId } = args;
      return of(fakeDB.tickets)
      .pipe(
        tap(tickets => {
          if(!documentId){ throw DOCUMENT_ID_REQUIRED }
          if( drawId && !tickets.find(t => t.drawId == drawId)){ throw  INVALID_DRAW_ID }
        }),
        mergeMap(tickets => from(tickets)),
        filter(ticket => ( drawId ? ticket.drawId === drawId : true)),
        filter(ticket => ( documentId ? ticket.clientDocumentId === documentId : true)),
        toArray()
      )
      .toPromise();
    },
    lotteryRedeemedPrizes(root, args, context){
      console.log('Query => lotteryRedeemedPrizes', args );
      const { transactionId, drawId, fromTimestamp, toTimestamp, page, pageSize, terminal} = args.input;
      return from(fakeDB.prizes)
        .pipe(
          filter(prize => prize.prizeClaimed),
          filter(prize => prize.claimedTimestamp > fromTimestamp),
          filter(prize => toTimestamp ? prize.claimedTimestamp < toTimestamp : true),
          filter(prize => (transactionId && transactionId !== '') ? prize.transactionId === transactionId : true),
          filter(ticket => (drawId && drawId !== '') ? ticket.drawId === drawId : true),
          filter(ticket => (terminal||{}).id ? ( (ticket.terminal || {}).id === terminal.id) : true),
          filter(ticket => (terminal||{}).userId ? ( (ticket.terminal || {}).userId === terminal.userId) : true),
          filter(ticket => (terminal||{}).userName ? ( (ticket.terminal || {}).userName === terminal.userName) : true),
          skip( page * pageSize ),
          take(pageSize),
          toArray()
        )
       .toPromise();
    },
    lotteryClaimedPrizes(root, args, context) {
      console.log('Query => lotteryClaimedPrizes', args );
      const { drawId, documentId } = args;
      return from(fakeDB.prizes)
      .pipe(
        filter(prize => drawId ? prize.drawId === drawId : true),
        filter(prize => documentId ? prize.documentId === documentId : true),
        toArray()
      )
      .toPromise();
    }
  },
  // MUTATIONS //
  Mutation: {
    lotteryBuyTicket(root, args, context) {
      console.log('MUTATION => lotteryBuyTicket');
      const INVALID_DRAW_ID = createCustonError('Invalid draw Id', `lotteryBuyTicket`, 10100, 'El id del sorteo no corresponde a nigun sorteo');
      const INVALID_NUMBER = createCustonError('Invalid number', `lotteryBuyTicket`, 10108, 'numero invalido');
      const INVALID_SERIES = createCustonError('Series', `lotteryBuyTicket`, 10109, 'numero de serie invalido');
      const TICKETS_ECXEED_AVAILABLE_TICKETS = createCustonError('number of tickets exceed available tickets',
        `lotteryBuyTicket`, 10110, 'El numero de tiquetes a oprar excede el numero de tiquetes disponibles');
      const NUMBER_AND_SERIE_NOT_AVAILABLE = createCustonError('Number and series no longer available', `lotteryBuyTicket`, 10111, 'serie y numero no estan disponibles');
      const NOT_ACTIVE_DRAW = createCustonError('not active draw', `lotteryBuyTicket`, 10112, 'El sorteo no esta activo');

      console.log('Mutation => lotteryBuyTicket', args );
      const { drawId, ticketNumber, ticketSeries, ticketCount,
        clientName, clientDocumentId, clientPhoneNumber,
        transactionId, divipolaCode, terminal
      } = args.input;

      if(drawId.length < 4){
        throw INVALID_DRAW_ID;
      }

      return of(fakeDB.lotteries)
      .pipe(
        map(lotteries => lotteries.filter(lottery => lottery.draws.find(draw => draw.id == drawId)) ),
        map(lotteries => {

          if(!lotteries[0]){ throw INVALID_DRAW_ID; }
          let drawsWithSerie = lotteries[0].draws.filter(draw => (draw.id == drawId &&  draw.series.find(serie => serie.series === ticketSeries) ) );
          if(drawsWithSerie.length == 0){ throw INVALID_SERIES }
          let selectedSerie = drawsWithSerie[0].series.filter(serie => serie.series === ticketSeries);
          selectedSerie = selectedSerie.filter(ss => ss.number == ticketNumber)[0]
          if(!selectedSerie){ throw INVALID_NUMBER }
          if(selectedSerie.availableTickets < ticketCount ){ console.log(selectedSerie); throw TICKETS_ECXEED_AVAILABLE_TICKETS; }

          // modify available tickets
          const lotteryIndex  = fakeDB.lotteries.findIndex(l => l == lotteries[0]);
          const drawIndex = fakeDB.lotteries[lotteryIndex].draws.findIndex(draw => draw == drawsWithSerie[0]);
          const serieIndex = fakeDB.lotteries[lotteryIndex].draws[drawIndex].series.findIndex(serie => serie ==  selectedSerie);
          
          // console.log({lotteryIndex, drawIndex });
          // console.log(fakeDB.lotteries[lotteryIndex].draws[drawIndex].series[serieIndex] );
          fakeDB.lotteries[lotteryIndex].draws[drawIndex].series[serieIndex].availableTickets =  selectedSerie.availableTickets - ticketCount;
          
          return {...drawsWithSerie[0], series: [selectedSerie]}         

        }),
        map(draw => {
          const ticket ={
            id: uuidv4(),    
            timestamp: Date.now(),    
            drawId: draw.id,
            ticketNumber: ticketNumber,
            ticketSeries: ticketSeries,
            ticketCount: ticketCount,
            clientName: clientName,
            clientDocumentId: clientDocumentId,
            clientPhoneNumber: clientPhoneNumber,
            transactionId: transactionId,
            terminal: terminal
          }

          fakeDB.tickets.push(ticket);
          
          
          
          return ticket;
        }),     
      )
      .toPromise();      
    },
    lotteryClaimPrize(root, args, context) {
      console.log('MUTATION lotteryClaimPrize', args);
      const INVALID_DRAW_ID = createCustonError('Invalid draw Id', `lotteryClaimPrize`, 10100, 'El id del sorteo no corresponde a nigun sorteo');
      const INVALID_CLAIM_CODE = createCustonError('Invalid claim code', `lotteryClaimPrize`, 10105, 'El codigo de reclamacion no es el correcto');
      const INVALID_PRIZE_ID = createCustonError('Invalid prize id', `lotteryClaimPrize`, 10113, 'El id del sorteo no es valido');
      const DOCUMENT_NO_FOUND = createCustonError('Document no found', `lotteryClaimPrize`, 10114, 'Documento no encontrado');
      const LOCKED_TICKET = createCustonError('Locked ticket', `lotteryClaimPrize`, 10115, 'El ticket está bloqueado');
      const PRIZE_ALREADY_CLAIMED = createCustonError('Prize already claimed', `lotteryClaimPrize`, 10116, 'El premio ya fue reclamado');
      const NOT_ACTIVE_DRAW = createCustonError('not active draw', `lotteryBuyTicket`, 10112, 'El sorteo no esta activo');

      const { drawId, documentId, prizeId, claimCode, transactionId, divipolaCode, terminal } = args.input ;
    
      return of(fakeDB.prizes)
      .pipe(
        map(prizes => prizes.find(prize => prize.drawId === drawId) ),
        map(prize => { 
          if(!prize){ throw  INVALID_DRAW_ID }
          else if(prize.prizeClaimed){ throw PRIZE_ALREADY_CLAIMED }
          else if(prize.prizeId !== prizeId){ throw INVALID_PRIZE_ID }
          else if(prize.documentId !== documentId){ throw DOCUMENT_NO_FOUND }
          else if(prize.claimCode !== claimCode){ throw INVALID_CLAIM_CODE }
          else{
            const index = fakeDB.prizes.findIndex(p => p == prize);
            const prizeConfirmation = {
              ... prize,
              transactionId,
              divipolaCode,
              prizeClaimed: true,
              terminal: terminal

            };
            fakeDB.prizes[index] = prizeConfirmation;
            return fakeDB.prizes[index];
          }
        }),
      )
      .toPromise();      
    },
    lotteryResendPrizeClaimCode(root, args, context) {
      const INVALID_DRAW_ID = createCustonError('Invalid draw Id', `lotteryResendPrizeClaimCode`, 10100, 'El id del sorteo no es valido');
      const INVALID_DOCUMENT_ID = createCustonError('Invalid document Id', `lotteryResendPrizeClaimCode`, 10104, 'El id del document no es válido');

      console.log('MUTATION lotteryResendPrizeClaimCode', args );
      const { drawId, documentId, terminal } = args;
      return of(fakeDB.lotteries)
      .pipe(
        tap(() => {
          if(!drawId){ throw INVALID_DRAW_ID };
          if(!documentId){ throw INVALID_DOCUMENT_ID };
        }),
        map(lotteries => lotteries.filter(lottery => lottery.draws.find(draw => draw == drawId))), // todo here
        map(() => ({
          code: 200,
          message: 'Prize claim code was resent to client successful'
          })
        ) 
      )
      .toPromise();      
    },
  },
  //// SUBSCRIPTIONS ///////
  // Subscription: {
  // }
};

//// SUBSCRIPTIONS SOURCES ////

const eventDescriptors = [];

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

const fakeDB = {
  lotteries: [
    { id: '4d8f-9g6t-2w6s', name:'Cruz Roja', draws:[] },
    { id: '4q5s-f8g9-g6h5', name:'Cundinamarca', draws: []},
    { id: 'DE45-JI45-KO12', name: 'Quindío', draws: []},
    { id: '2Q2W-3E3D-5D9A', name: 'Lotería de Medellín', draws: [] },
    { id: '6F6T-9T5G-5D9G', name: 'Paisita 1', draws: [] },
    { id: '4D8V-2W8H-Q96F', name: 'Chontico Día', draws: [] },      
  ],
  prizes: [],
  tickets: [],
};

function autoFillFakeDatabase(){
  // FILL LOTTERIES
  fakeDB.lotteries.forEach(lottery => { // for each lottery
    const drawsGenerated = [];
    (new Array(5).fill(0)).forEach((v,i) => { // fill 5 draw for each lottery
      
      const autoGeneratedSeries = [];
      (new Array(Math.floor(Math.random()* 5000)).fill(0)).forEach((v,i) => {  // add from 0 to 30 series

        const serieRawNumber =  ( ( i - (i%5) )/5 ).toString();
        const currentSerie =  serieRawNumber.length >= 3 ? serieRawNumber : new Array(3 - serieRawNumber.length + 1).join('0') + serieRawNumber;
        const currentSerieArray = autoGeneratedSeries.filter(s => s.series == currentSerie);
        let nextNumber = currentSerieArray.length > 0
         ? (parseInt(currentSerieArray.pop().number)+1).toString()
         : '0';
        nextNumber = nextNumber.length >= 3 ? nextNumber : new Array(3 - nextNumber.length + 1).join('0') + nextNumber;
        const serieToPush = {
          series: currentSerie,
          availableTickets: 5,
          number: nextNumber
        };
        autoGeneratedSeries.push(serieToPush)
      })

      drawsGenerated.push({
        id: uuidv4(),
        open: Math.random() > 0.49,
        name: `Juego ${i}`,
        number: Math.floor(Math.random() * 100) + 100,
        series: autoGeneratedSeries
      })
      // console.log(autoGeneratedSeries);
    });
    lottery.draws = drawsGenerated;
  });
  // FILL LOTTERIES


  // FILL PRIZES
  fakeDB.lotteries.forEach(lottery => {
    lottery.draws.forEach(draw => {
      const codeToClaim = generateCode(3,3);
      const prizeAmount = Math.floor(Math.random() * 500 ) * 1000000;

      let prizeToPush = {
        drawId: draw.id,
        claimCode: codeToClaim,
        prizeId: uuidv4(),
        prizeName: `Premio ${lottery.name} - ${Math.floor(Math.random() * 10)}`,
        prizeTotal: prizeAmount,
        prizePayment: prizeAmount - Math.floor((prizeAmount * 15)/100),
        prizeClaimed: false,
      };

      const x = Math.floor(Math.random()*4);
      const winnerIndex = Math.floor(Math.random() * draw.series.length);

      if(x == 2){
        // give a owner and leave ready to claim
        prizeToPush = {
          ...prizeToPush,
          documentId: '10450501265',
          ticketNumber: draw.series[winnerIndex].number,
          ticketSeries: draw.series[winnerIndex].series,
          ticketId: uuidv4(),
          
      };
      console.log('GIVING A PRIZE OWNER', prizeToPush );
      } else if(x == 3){
         // claiming prize
         prizeToPush = {
          ...prizeToPush,
          documentId: '10450501265',
          claimedTimestamp: Date.now(),
          transactionId: uuidv4(),
          prizeClaimed: true, 
          ticketNumber: draw.series[winnerIndex].number,
          ticketSeries: draw.series[winnerIndex].series,
          ticketId: uuidv4(),
          terminal: {
            id: uuidv4(),
            userId: uuidv4(),
            userName: 'juan.santa'
          }          
      };
      console.log('CLAIMING A PRIZE', prizeToPush );

      }

      // console.log(prizeToPush);
      fakeDB.prizes.push(prizeToPush)

    })
  })
}

function generateCode(lettersQty=3, numbersQty=3, separator = '-'){
  const letters = "ABCDEFGHIJKLMOPQRSTUVWXYZ";
  const numbers = "1234567890";
  return (new Array(lettersQty+numbersQty).fill(0)).map((v, i) => (i%2 == 0) 
    ? ( i%3 == 0 && i != 0 ) 
      ? `${separator}${numbers[Math.floor(Math.random() * numbers.length )]}`
      : numbers[Math.floor(Math.random() * numbers.length )]
    : ( i%3 == 0 && i != 0 )
      ?  `${separator}${letters[Math.floor(Math.random() * numbers.length )]}`
      : letters[Math.floor(Math.random() * numbers.length )]
    ).join('');
}


autoFillFakeDatabase();

