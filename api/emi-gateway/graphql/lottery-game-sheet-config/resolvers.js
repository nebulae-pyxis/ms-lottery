const withFilter = require("graphql-subscriptions").withFilter;
const PubSub = require("graphql-subscriptions").PubSub;
const pubsub = new PubSub();
const { of } = require("rxjs");
const { map, mergeMap, catchError } = require('rxjs/operators');
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


module.exports = {

    //// QUERY ///////

    Query: {
        LotteryGames(root, args, context) {
            return RoleValidator.checkPermissions$(context.authToken.realm_access.roles, 'ms-' + 'Lottery', 'LotteryGames', PERMISSION_DENIED_ERROR_CODE, 'Permission denied', ["PLATFORM-ADMIN"])
                .pipe(
                    mergeMap(() =>
                        broker
                            .forwardAndGetReply$(
                                "LotteryGame",
                                "emigateway.graphql.query.LotteryGames",
                                { root, args, jwt: context.encodedToken },
                                2000
                            )
                    ),
                    catchError(err => handleError$(err, "LotteryGames")),
                    mergeMap(response => getResponseFromBackEnd$(response))
                ).toPromise();
        },
        LotteryGamesSize(root, args, context) {
            return RoleValidator.checkPermissions$(context.authToken.realm_access.roles, 'ms-' + 'Lottery', 'LotteryGamesSize', PERMISSION_DENIED_ERROR_CODE, 'Permission denied', ["PLATFORM-ADMIN"])
                .pipe(
                    mergeMap(() =>
                        broker
                            .forwardAndGetReply$(
                                "LotteryGame",
                                "emigateway.graphql.query.LotteryGamesSize",
                                { root, args, jwt: context.encodedToken },
                                2000
                            )
                    ),
                    catchError(err => handleError$(err, "LotteryGamesSize")),
                    mergeMap(response => getResponseFromBackEnd$(response))
                ).toPromise();
        },
        LotteryGame(root, args, context) {
            return RoleValidator.checkPermissions$(context.authToken.realm_access.roles, 'ms-' + 'Lottery', 'LotteryGame', PERMISSION_DENIED_ERROR_CODE, 'Permission denied', ["PLATFORM-ADMIN"])
                .pipe(
                    mergeMap(() =>
                        broker
                            .forwardAndGetReply$(
                                "LotteryGame",
                                "emigateway.graphql.query.LotteryGame",
                                { root, args, jwt: context.encodedToken },
                                2000
                            )
                    ),
                    catchError(err => handleError$(err, "LotteryGame")),
                    mergeMap(response => getResponseFromBackEnd$(response))
                ).toPromise();
        },

        LotteryGameSheetConfigList(root, args, context) {
            return RoleValidator.checkPermissions$(context.authToken.realm_access.roles, 'ms-' + 'Lottery', 'LotteryGameSheetConfig', PERMISSION_DENIED_ERROR_CODE, 'Permission denied', ["PLATFORM-ADMIN"])
                .pipe(
                    mergeMap(() =>
                        broker
                            .forwardAndGetReply$(
                                "LotteryGameSheetConfig",
                                "emigateway.graphql.query.LotteryGameSheetConfigList",
                                { root, args, jwt: context.encodedToken },
                                2000
                            )
                    ),
                    catchError(err => handleError$(err, "LotteryGameSheetConfig")),
                    mergeMap(response => getResponseFromBackEnd$(response))
                ).toPromise();
        },
        LotteryGameSheetConfig(root, args, context) {
            return RoleValidator.checkPermissions$(context.authToken.realm_access.roles, 'ms-' + 'Lottery', 'LotteryGameSheetConfig', PERMISSION_DENIED_ERROR_CODE, 'Permission denied', ["PLATFORM-ADMIN"])
                .pipe(
                    mergeMap(() =>
                        broker
                            .forwardAndGetReply$(
                                "LotteryGameSheetConfig",
                                "emigateway.graphql.query.LotteryGameSheetConfig",
                                { root, args, jwt: context.encodedToken },
                                2000
                            )
                    ),
                    catchError(err => handleError$(err, "LotteryGameSheetConfig")),
                    mergeMap(response => getResponseFromBackEnd$(response))
                ).toPromise();
        }
    },

    //// MUTATIONS ///////
    Mutation: {
        LotteryCreateGame(root, args, context) {
            return RoleValidator.checkPermissions$(
                context.authToken.realm_access.roles,
                "LotteryGame",
                "LotteryCreateGame",
                PERMISSION_DENIED_ERROR_CODE,
                "Permission denied",
                ["PLATFORM-ADMIN"]
            )
                .pipe(
                    mergeMap(() =>
                        context.broker.forwardAndGetReply$(
                            "LotteryGame",
                            "emigateway.graphql.mutation.LotteryCreateLotteryGame",
                            { root, args, jwt: context.encodedToken },
                            2000
                        )
                    ),
                    catchError(err => handleError$(err, "LotteryCreateGame")),
                    mergeMap(response => getResponseFromBackEnd$(response))
                ).toPromise();
        },
        LotteryUpdateGameGeneralInfo(root, args, context) {
            return RoleValidator.checkPermissions$(
                context.authToken.realm_access.roles,
                "LotteryGame",
                "LotteryUpdateGameGeneralInfo",
                PERMISSION_DENIED_ERROR_CODE,
                "Permission denied",
                ["PLATFORM-ADMIN"]
            ).pipe(
                mergeMap(() =>
                    context.broker.forwardAndGetReply$(
                        "LotteryGame",
                        "emigateway.graphql.mutation.LotteryUpdateLotteryGameGeneralInfo",
                        { root, args, jwt: context.encodedToken },
                        2000
                    )
                ),
                catchError(err => handleError$(err, "updateGameGeneralInfo")),
                mergeMap(response => getResponseFromBackEnd$(response))
            ).toPromise();
        },
        LotteryUpdateGameState(root, args, context) {
            return RoleValidator.checkPermissions$(
                context.authToken.realm_access.roles,
                "LotteryGame",
                "LotteryUpdateGameState",
                PERMISSION_DENIED_ERROR_CODE,
                "Permission denied",
                ["PLATFORM-ADMIN"]
            ).pipe(
                mergeMap(() =>
                    context.broker.forwardAndGetReply$(
                        "LotteryGame",
                        "emigateway.graphql.mutation.LotteryUpdateLotteryGameState",
                        { root, args, jwt: context.encodedToken },
                        2000
                    )
                ),
                catchError(err => handleError$(err, "updateGameState")),
                mergeMap(response => getResponseFromBackEnd$(response))
            ).toPromise();
        },
        CreateLotteryGameSheetConfig(root, args, context) {
            return RoleValidator.checkPermissions$(
                context.authToken.realm_access.roles,
                "LotteryGameSheetConfig",
                "CreateLotteryGameSheetConfig",
                PERMISSION_DENIED_ERROR_CODE,
                "Permission denied",
                ["PLATFORM-ADMIN"]
            ).pipe(
                mergeMap(() =>
                    context.broker.forwardAndGetReply$(
                        "LotteryGameSheetConfig",
                        "emigateway.graphql.mutation.CreateLotteryGameSheetConfig",
                        { root, args, jwt: context.encodedToken },
                        2000
                    )
                ),
                catchError(err => handleError$(err, "CreateLotteryGameSheetConfig")),
                mergeMap(response => getResponseFromBackEnd$(response))
            ).toPromise();
        },
        UpdateLotteryGameSheetConfig(root, args, context) {
            return RoleValidator.checkPermissions$(
                context.authToken.realm_access.roles,
                "LotteryGameSheetConfig",
                "UpdateLotteryGameSheetConfig",
                PERMISSION_DENIED_ERROR_CODE,
                "Permission denied",
                ["PLATFORM-ADMIN"]
            ).pipe(
                mergeMap(() =>
                    context.broker.forwardAndGetReply$(
                        "LotteryGameSheetConfig",
                        "emigateway.graphql.mutation.UpdateLotteryGameSheetConfig",
                        { root, args, jwt: context.encodedToken },
                        2000
                    )
                ),
                catchError(err => handleError$(err, "UpdateLotteryGameSheetConfig")),
                mergeMap(response => getResponseFromBackEnd$(response))
            ).toPromise();
        },
        ApproveLotteryGameSheetConfig(root, args, context) {
            return RoleValidator.checkPermissions$(
                context.authToken.realm_access.roles,
                "LotteryGameSheetConfig",
                "ApproveLotteryGameSheetConfig",
                PERMISSION_DENIED_ERROR_CODE,
                "Permission denied",
                ["PLATFORM-ADMIN"]
            ).pipe(
                mergeMap(() =>
                    context.broker.forwardAndGetReply$(
                        "LotteryGameSheetConfig",
                        "emigateway.graphql.mutation.ApproveLotteryGameSheetConfig",
                        { root, args, jwt: context.encodedToken },
                        2000
                    )
                ),
                catchError(err => handleError$(err, "ApproveLotteryGameSheetConfig")),
                mergeMap(response => getResponseFromBackEnd$(response))
            ).toPromise();
        },
        RevokeLotteryGameSheetConfig(root, args, context) {
            return RoleValidator.checkPermissions$(
                context.authToken.realm_access.roles,
                "LotteryGameSheetConfig",
                "RevokeLotteryGameSheetConfig",
                PERMISSION_DENIED_ERROR_CODE,
                "Permission denied",
                ["PLATFORM-ADMIN"]
            ).pipe(
                mergeMap(() =>
                    context.broker.forwardAndGetReply$(
                        "LotteryGameSheetConfig",
                        "emigateway.graphql.mutation.RevokeLotteryGameSheetConfig",
                        { root, args, jwt: context.encodedToken },
                        2000
                    )
                ),
                catchError(err => handleError$(err, "RevokeLotteryGameSheetConfig")),
                mergeMap(response => getResponseFromBackEnd$(response))
            ).toPromise();
        },
    },

    //// SUBSCRIPTIONS ///////
    Subscription: {
        LotteryGameSheetConfigUpdatedSubscription: {
            subscribe: withFilter(
                (payload, variables, context, info) => {
                    return pubsub.asyncIterator("LotteryGameSheetConfigUpdatedSubscription");
                },
                (payload, variables, context, info) => {
                    return true;
                }
            )
        }

    }
};



//// SUBSCRIPTIONS SOURCES ////

const eventDescriptors = [
    {
        backendEventName: 'LotteryGameSheetConfigUpdatedSubscription',
        gqlSubscriptionName: 'LotteryGameSheetConfigUpdatedSubscription',
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


