const withFilter = require("graphql-subscriptions").withFilter;
const PubSub = require("graphql-subscriptions").PubSub;
const pubsub = new PubSub();
const { of } = require("rxjs");
const { map, mergeMap, catchError, tap } = require('rxjs/operators');
const broker = require("../../broker/BrokerFactory")();
const RoleValidator = require('../../tools/RoleValidator');
const { handleError$ } = require('../../tools/GraphqlResponseTools');

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

function verifyUserRoles(context) { 
    return context.authToken.realm_access.roles.some(role => role === 'LOTTERY-ADMIN' || role === 'PLATFORM-ADMIN' || 'LOTTERY-APPROVER');
}

module.exports = {

    //// QUERY ///////

    Query: {
        LotteryGamePrizeProgramList(root, args, context) {
            return RoleValidator.checkPermissions$(context.authToken.realm_access.roles,
                'ms-' + 'Lottery',
                'LotteryGamePrizeProgram',
                PERMISSION_DENIED_ERROR_CODE,
                'Permission denied', ["PLATFORM-ADMIN", "LOTTERY-ADMIN", "LOTTERY-APPROVER"])
                .pipe(
                    mergeMap(() =>
                        broker
                            .forwardAndGetReply$(
                                "LotteryGamePrizeProgram",
                                "emigateway.graphql.query.LotteryGamePrizeProgramList",
                                { root, args, jwt: context.encodedToken },
                                2000
                            )
                    ),
                    catchError(err => handleError$(err, "LotteryGamePrizeProgram")),
                    mergeMap(response => getResponseFromBackEnd$(response))
                ).toPromise();
        },
        LotteryGamePrizeProgram(root, args, context) {
            return RoleValidator.checkPermissions$(context.authToken.realm_access.roles,
                'ms-' + 'Lottery',
                'LotteryGamePrizeProgram',
                PERMISSION_DENIED_ERROR_CODE,
                'Permission denied', ["PLATFORM-ADMIN", "LOTTERY-ADMIN", "LOTTERY-APPROVER"])
                .pipe(
                    mergeMap(() =>
                        broker
                            .forwardAndGetReply$(
                                "LotteryGamePrizeProgram",
                                "emigateway.graphql.query.LotteryGamePrizeProgram",
                                { root, args, jwt: context.encodedToken },
                                2000
                            )
                    ),
                    catchError(err => handleError$(err, "LotteryGamePrizeProgram")),
                    mergeMap(response => getResponseFromBackEnd$(response))
                ).toPromise();
        }
    },

    //// MUTATIONS ///////
    Mutation: {
        CreateLotteryGamePrizeProgram(root, args, context) {
            return RoleValidator.checkPermissions$(
                context.authToken.realm_access.roles,
                "LotteryGamePrizeProgram",
                "CreateLotteryGamePrizeProgram",
                PERMISSION_DENIED_ERROR_CODE,
                "Permission denied",
                ["PLATFORM-ADMIN", "LOTTERY-ADMIN"]
            ).pipe(
                mergeMap(() =>
                    context.broker.forwardAndGetReply$(
                        "LotteryGamePrizeProgram",
                        "emigateway.graphql.mutation.CreateLotteryGamePrizeProgram",
                        { root, args, jwt: context.encodedToken },
                        2000
                    )
                ),
                catchError(err => handleError$(err, "CreateLotteryGamePrizeProgram")),
                mergeMap(response => getResponseFromBackEnd$(response))
            ).toPromise();
        },
        UpdateLotteryGamePrizeProgram(root, args, context) {
            return RoleValidator.checkPermissions$(
                context.authToken.realm_access.roles,
                "LotteryGamePrizeProgram",
                "UpdateLotteryGamePrizeProgram",
                PERMISSION_DENIED_ERROR_CODE,
                "Permission denied",
                ["PLATFORM-ADMIN", "LOTTERY-ADMIN"]
            ).pipe(
                mergeMap(() =>
                    context.broker.forwardAndGetReply$(
                        "LotteryGamePrizeProgram",
                        "emigateway.graphql.mutation.UpdateLotteryGamePrizeProgram",
                        { root, args, jwt: context.encodedToken },
                        2000
                    )
                ),
                catchError(err => handleError$(err, "UpdateLotteryGamePrizeProgram")),
                mergeMap(response => getResponseFromBackEnd$(response))
            ).toPromise();
        },
        ApproveLotteryGamePrizeProgram(root, args, context) {
            return RoleValidator.checkPermissions$(
                context.authToken.realm_access.roles,
                "LotteryGamePrizeProgram",
                "ApproveLotteryGamePrizeProgram",
                PERMISSION_DENIED_ERROR_CODE,
                "Permission denied",
                ["PLATFORM-ADMIN", "LOTTERY-APPROVER"]
            ).pipe(
                mergeMap(() =>
                    context.broker.forwardAndGetReply$(
                        "LotteryGamePrizeProgram",
                        "emigateway.graphql.mutation.ApproveLotteryGamePrizeProgram",
                        { root, args, jwt: context.encodedToken },
                        2000
                    )
                ),
                catchError(err => handleError$(err, "ApproveLotteryGamePrizeProgram")),
                mergeMap(response => getResponseFromBackEnd$(response))
            ).toPromise();
        },
        RevokeLotteryGamePrizeProgram(root, args, context) {
            return RoleValidator.checkPermissions$(
                context.authToken.realm_access.roles,
                "LotteryGamePrizeProgram",
                "RevokeLotteryGamePrizeProgram",
                PERMISSION_DENIED_ERROR_CODE,
                "Permission denied",
                ["PLATFORM-ADMIN", "LOTTERY-APPROVER"]
            ).pipe(
                mergeMap(() =>
                    context.broker.forwardAndGetReply$(
                        "LotteryGamePrizeProgram",
                        "emigateway.graphql.mutation.RevokeLotteryGamePrizeProgram",
                        { root, args, jwt: context.encodedToken },
                        2000
                    )
                ),
                catchError(err => handleError$(err, "RevokeLotteryGamePrizeProgram")),
                mergeMap(response => getResponseFromBackEnd$(response))
            ).toPromise();
        },
    },

    //// SUBSCRIPTIONS ///////
    Subscription: {
        LotteryGamePrizeProgramUpdatedSubscription: {
            subscribe: withFilter(
                (payload, variables, context, info) => {
                    return pubsub.asyncIterator("LotteryGamePrizeProgramUpdatedSubscription");
                },
                (payload, variables, context, info) => {
                    return verifyUserRoles(context) && payload.LotteryGamePrizeProgramUpdatedSubscription.gameId === variables.gameId;
                }
            )
        }

    }
};



//// SUBSCRIPTIONS SOURCES ////

const eventDescriptors = [
    {
        backendEventName: 'LotteryGamePrizeProgramUpdatedSubscription',
        gqlSubscriptionName: 'LotteryGamePrizeProgramUpdatedSubscription',
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


