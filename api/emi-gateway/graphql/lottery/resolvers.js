const withFilter = require("graphql-subscriptions").withFilter;
const PubSub = require("graphql-subscriptions").PubSub;
const pubsub = new PubSub();
const { of } = require("rxjs");
const { map, mergeMap, catchError } = require('rxjs/operators');
const broker = require("../../broker/BrokerFactory")();
const RoleValidator = require('../../tools/RoleValidator');
const {handleError$} = require('../../tools/GraphqlResponseTools');

const INTERNAL_SERVER_ERROR_CODE = 1;
const PERMISSION_DENIED_ERROR_CODE = 2;

function getResponseFromBackEnd$(response) {
    return of(response)
    .pipe(
        map(resp => {
            if (resp.result.code != 200) {
                const err = new Error();
                err.name = 'Error';
                err.message = resp.result.error;
                // this[Symbol()] = resp.result.error;
                Error.captureStackTrace(err, 'Error');
                throw err;
            }
            return resp.data;
        })
    );
}


module.exports = {

    //// QUERY ///////

    Query: {
        LotteryLotteries(root, args, context) {
            return RoleValidator.checkPermissions$(context.authToken.realm_access.roles, 'ms-'+'Lottery', 'LotteryLotteries', PERMISSION_DENIED_ERROR_CODE, 'Permission denied', ["PLATFORM-ADMIN"])
            .pipe(
                mergeMap(() =>
                    broker
                    .forwardAndGetReply$(
                        "Lottery",
                        "emigateway.graphql.query.LotteryLotteries",
                        { root, args, jwt: context.encodedToken },
                        2000
                    )
                ),
                catchError(err => handleError$(err, "LotteryLotteries")),
                mergeMap(response => getResponseFromBackEnd$(response))
            ).toPromise();
        },
        LotteryLotteriesSize(root, args, context) {
            return RoleValidator.checkPermissions$(context.authToken.realm_access.roles, 'ms-'+'Lottery', 'LotteryLotteriesSize', PERMISSION_DENIED_ERROR_CODE, 'Permission denied', ["PLATFORM-ADMIN"])
            .pipe(
                mergeMap(() =>
                    broker
                    .forwardAndGetReply$(
                        "Lottery",
                        "emigateway.graphql.query.LotteryLotteriesSize",
                        { root, args, jwt: context.encodedToken },
                        2000
                    )
                ),
                catchError(err => handleError$(err, "LotteryLotteriesSize")),
                mergeMap(response => getResponseFromBackEnd$(response))
            ).toPromise();
        },
        LotteryLottery(root, args, context) {
            return RoleValidator.checkPermissions$(context.authToken.realm_access.roles, 'ms-'+'Lottery', 'LotteryLottery', PERMISSION_DENIED_ERROR_CODE, 'Permission denied', ["PLATFORM-ADMIN"])
            .pipe(
                mergeMap(() =>
                    broker
                    .forwardAndGetReply$(
                        "Lottery",
                        "emigateway.graphql.query.LotteryLottery",
                        { root, args, jwt: context.encodedToken },
                        2000
                    )
                ),
                catchError(err => handleError$(err, "LotteryLottery")),
                mergeMap(response => getResponseFromBackEnd$(response))
            ).toPromise();
        }
    },

    //// MUTATIONS ///////
    Mutation: {
        LotteryCreateLottery(root, args, context) {
            return RoleValidator.checkPermissions$(
              context.authToken.realm_access.roles,
              "Lottery",
              "LotteryCreateLottery",
              PERMISSION_DENIED_ERROR_CODE,
              "Permission denied",
              ["PLATFORM-ADMIN"]
            )
            .pipe(
                mergeMap(() =>
                  context.broker.forwardAndGetReply$(
                    "Lottery",
                    "emigateway.graphql.mutation.LotteryCreateLottery",
                    { root, args, jwt: context.encodedToken },
                    2000
                  )
                ),
                catchError(err => handleError$(err, "LotteryCreateLottery")),
                mergeMap(response => getResponseFromBackEnd$(response))
            ).toPromise();
        },
        LotteryUpdateLotteryGeneralInfo(root, args, context) {
            return RoleValidator.checkPermissions$(
              context.authToken.realm_access.roles,
              "Lottery",
              "LotteryUpdateLotteryGeneralInfo",
              PERMISSION_DENIED_ERROR_CODE,
              "Permission denied",
              ["PLATFORM-ADMIN"]
            ).pipe(
                mergeMap(() =>
                  context.broker.forwardAndGetReply$(
                    "Lottery",
                    "emigateway.graphql.mutation.LotteryUpdateLotteryGeneralInfo",
                    { root, args, jwt: context.encodedToken },
                    2000
                  )
                ),
                catchError(err => handleError$(err, "updateLotteryGeneralInfo")),
                mergeMap(response => getResponseFromBackEnd$(response))
            ).toPromise();
        },
        LotteryUpdateLotteryState(root, args, context) {
            return RoleValidator.checkPermissions$(
              context.authToken.realm_access.roles,
              "Lottery",
              "LotteryUpdateLotteryState",
              PERMISSION_DENIED_ERROR_CODE,
              "Permission denied",
              ["PLATFORM-ADMIN"]
            ).pipe(
                mergeMap(() =>
                  context.broker.forwardAndGetReply$(
                    "Lottery",
                    "emigateway.graphql.mutation.LotteryUpdateLotteryState",
                    { root, args, jwt: context.encodedToken },
                    2000
                  )
                ),
                catchError(err => handleError$(err, "updateLotteryState")),
                mergeMap(response => getResponseFromBackEnd$(response))
            ).toPromise();
        },
    },

    //// SUBSCRIPTIONS ///////
    Subscription: {
        LotteryLotteryUpdatedSubscription: {
            subscribe: withFilter(
                (payload, variables, context, info) => {
                    return pubsub.asyncIterator("LotteryLotteryUpdatedSubscription");
                },
                (payload, variables, context, info) => {
                    return true;
                }
            )
        },
    }
};



//// SUBSCRIPTIONS SOURCES ////

const eventDescriptors = [
    {
        backendEventName: 'LotteryLotteryUpdatedSubscription',
        gqlSubscriptionName: 'LotteryLotteryUpdatedSubscription',
        dataExtractor: (evt) => evt.data,// OPTIONAL, only use if needed
        onError: (error, descriptor) => console.log(`Error processing ${descriptor.backendEventName}`),// OPTIONAL, only use if needed
        onEvent: (evt, descriptor) => console.log(`Event of type  ${descriptor.backendEventName} arraived`),// OPTIONAL, only use if needed
    },
];


/**
 * Connects every backend event to the right GQL subscription
 */
eventDescriptors.forEach(descriptor => {
    broker
        .getMaterializedViewsUpdates$([descriptor.backendEventName])
        .subscribe(
            evt => {
                if (descriptor.onEvent) {
                    descriptor.onEvent(evt, descriptor);
                }
                const payload = {};
                payload[descriptor.gqlSubscriptionName] = descriptor.dataExtractor ? descriptor.dataExtractor(evt) : evt.data
                pubsub.publish(descriptor.gqlSubscriptionName, payload);
            },

            error => {
                if (descriptor.onError) {
                    descriptor.onError(error, descriptor);
                }
                console.error(
                    `Error listening ${descriptor.gqlSubscriptionName}`,
                    error
                );
            },

            () =>
                console.log(
                    `${descriptor.gqlSubscriptionName} listener STOPPED`
                )
        );
});


