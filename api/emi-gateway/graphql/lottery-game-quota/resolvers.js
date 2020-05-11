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
        LotteryGameQuotaList(root, args, context) {
            return RoleValidator.checkPermissions$(context.authToken.realm_access.roles,
                'ms-' + 'Lottery',
                'LotteryGameQuota',
                PERMISSION_DENIED_ERROR_CODE,
                'Permission denied', ["PLATFORM-ADMIN", "LOTTERY-ADMIN", "LOTTERY-APPROVER"])
                .pipe(
                    mergeMap(() =>
                        broker
                            .forwardAndGetReply$(
                                "LotteryGameQuota",
                                "emigateway.graphql.query.LotteryGameQuotaList",
                                { root, args, jwt: context.encodedToken },
                                2000
                            )
                    ),
                    catchError(err => handleError$(err, "LotteryGameQuota")),
                    mergeMap(response => getResponseFromBackEnd$(response))
                ).toPromise();
        },
        LotteryGameQuota(root, args, context) {
            return RoleValidator.checkPermissions$(context.authToken.realm_access.roles,
                'ms-' + 'Lottery',
                'LotteryGameQuota',
                PERMISSION_DENIED_ERROR_CODE,
                'Permission denied', ["PLATFORM-ADMIN", "LOTTERY-ADMIN", "LOTTERY-APPROVER"])
                .pipe(
                    mergeMap(() =>
                        broker
                            .forwardAndGetReply$(
                                "LotteryGameQuota",
                                "emigateway.graphql.query.LotteryGameQuota",
                                { root, args, jwt: context.encodedToken },
                                2000
                            )
                    ),
                    catchError(err => handleError$(err, "LotteryGameQuota")),
                    mergeMap(response => getResponseFromBackEnd$(response))
                ).toPromise();
        },
        LotteryGameQuotaNumberList(root, args, context) {
            console.log('llega: ', args);
            return RoleValidator.checkPermissions$(context.authToken.realm_access.roles,
                'ms-' + 'Lottery',
                'LotteryGameQuota',
                PERMISSION_DENIED_ERROR_CODE,
                'Permission denied', ["PLATFORM-ADMIN", "LOTTERY-ADMIN", "LOTTERY-APPROVER"])
                .pipe(
                    mergeMap(() =>
                        broker
                            .forwardAndGetReply$(
                                "LotteryGameQuota",
                                "emigateway.graphql.query.LotteryGameQuotaNumberList",
                                { root, args, jwt: context.encodedToken },
                                2000
                            )
                    ),
                    catchError(err => handleError$(err, "LotteryGameQuota")),
                    mergeMap(response => getResponseFromBackEnd$(response))
                ).toPromise();
        },
        LotteryGameQuotaNumberListSize(root, args, context) {
            return RoleValidator.checkPermissions$(context.authToken.realm_access.roles,
                'ms-' + 'Lottery',
                'LotteryGameQuota',
                PERMISSION_DENIED_ERROR_CODE,
                'Permission denied', ["PLATFORM-ADMIN", "LOTTERY-ADMIN", "LOTTERY-APPROVER"])
                .pipe(
                    mergeMap(() =>
                        broker
                            .forwardAndGetReply$(
                                "LotteryGameQuota",
                                "emigateway.graphql.query.LotteryGameQuotaNumberListSize",
                                { root, args, jwt: context.encodedToken },
                                2000
                            )
                    ),
                    catchError(err => handleError$(err, "LotteryGameQuota")),
                    mergeMap(response => getResponseFromBackEnd$(response))
                ).toPromise();
        }
    },

    //// MUTATIONS ///////
    Mutation: {
        CreateLotteryGameQuota(root, args, context) {
            return RoleValidator.checkPermissions$(
                context.authToken.realm_access.roles,
                "LotteryGameQuota",
                "CreateLotteryGameQuota",
                PERMISSION_DENIED_ERROR_CODE,
                "Permission denied",
                ["PLATFORM-ADMIN", "LOTTERY-ADMIN"]
            ).pipe(
                mergeMap(() =>
                    context.broker.forwardAndGetReply$(
                        "LotteryGameQuota",
                        "emigateway.graphql.mutation.CreateLotteryGameQuota",
                        { root, args, jwt: context.encodedToken },
                        2000
                    )
                ),
                catchError(err => handleError$(err, "CreateLotteryGameQuota")),
                mergeMap(response => getResponseFromBackEnd$(response))
            ).toPromise();
        },
        UpdateLotteryGameQuota(root, args, context) {
            return RoleValidator.checkPermissions$(
                context.authToken.realm_access.roles,
                "LotteryGameQuota",
                "UpdateLotteryGameQuota",
                PERMISSION_DENIED_ERROR_CODE,
                "Permission denied",
                ["PLATFORM-ADMIN", "LOTTERY-ADMIN"]
            ).pipe(
                mergeMap(() =>
                    context.broker.forwardAndGetReply$(
                        "LotteryGameQuota",
                        "emigateway.graphql.mutation.UpdateLotteryGameQuota",
                        { root, args, jwt: context.encodedToken },
                        2000
                    )
                ),
                catchError(err => handleError$(err, "UpdateLotteryGameQuota")),
                mergeMap(response => getResponseFromBackEnd$(response))
            ).toPromise();
        },
        ApproveLotteryGameQuota(root, args, context) {
            return RoleValidator.checkPermissions$(
                context.authToken.realm_access.roles,
                "LotteryGameQuota",
                "ApproveLotteryGameQuota",
                PERMISSION_DENIED_ERROR_CODE,
                "Permission denied",
                ["PLATFORM-ADMIN", "LOTTERY-APPROVER"]
            ).pipe(
                mergeMap(() =>
                    context.broker.forwardAndGetReply$(
                        "LotteryGameQuota",
                        "emigateway.graphql.mutation.ApproveLotteryGameQuota",
                        { root, args, jwt: context.encodedToken },
                        2000
                    )
                ),
                catchError(err => handleError$(err, "ApproveLotteryGameQuota")),
                mergeMap(response => getResponseFromBackEnd$(response))
            ).toPromise();
        },
        RevokeLotteryGameQuota(root, args, context) {
            return RoleValidator.checkPermissions$(
                context.authToken.realm_access.roles,
                "LotteryGameQuota",
                "RevokeLotteryGameQuota",
                PERMISSION_DENIED_ERROR_CODE,
                "Permission denied",
                ["PLATFORM-ADMIN", "LOTTERY-APPROVER"]
            ).pipe(
                mergeMap(() =>
                    context.broker.forwardAndGetReply$(
                        "LotteryGameQuota",
                        "emigateway.graphql.mutation.RevokeLotteryGameQuota",
                        { root, args, jwt: context.encodedToken },
                        2000
                    )
                ),
                catchError(err => handleError$(err, "RevokeLotteryGameQuota")),
                mergeMap(response => getResponseFromBackEnd$(response))
            ).toPromise();
        },
        CreateLotteryGameQuotaNumber(root, args, context) {
            return RoleValidator.checkPermissions$(
                context.authToken.realm_access.roles,
                "LotteryGameQuota",
                "CreateLotteryGameQuotaNumber",
                PERMISSION_DENIED_ERROR_CODE,
                "Permission denied",
                ["PLATFORM-ADMIN", "LOTTERY-APPROVER","LOTTERY-ADMIN"]
            ).pipe(
                mergeMap(() =>
                    context.broker.forwardAndGetReply$(
                        "LotteryGameQuota",
                        "emigateway.graphql.mutation.CreateLotteryGameQuotaNumber",
                        { root, args, jwt: context.encodedToken },
                        2000
                    )
                ),
                catchError(err => handleError$(err, "CreateLotteryGameQuotaNumber")),
                mergeMap(response => getResponseFromBackEnd$(response))
            ).toPromise();
        },
        RemoveLotteryGameQuotaNumber(root, args, context) {
            return RoleValidator.checkPermissions$(
                context.authToken.realm_access.roles,
                "LotteryGameQuota",
                "RemoveLotteryGameQuotaNumber",
                PERMISSION_DENIED_ERROR_CODE,
                "Permission denied",
                ["PLATFORM-ADMIN","LOTTERY-ADMIN", "LOTTERY-APPROVER"]
            ).pipe(
                mergeMap(() =>
                    context.broker.forwardAndGetReply$(
                        "LotteryGameQuota",
                        "emigateway.graphql.mutation.RemoveLotteryGameQuotaNumber",
                        { root, args, jwt: context.encodedToken },
                        2000
                    )
                ),
                catchError(err => handleError$(err, "CreateLotteryGameQuotaNumber")),
                mergeMap(response => getResponseFromBackEnd$(response))
            ).toPromise();
        }
    },

    //// SUBSCRIPTIONS ///////
    Subscription: {
        LotteryGameQuotaUpdatedSubscription: {
            subscribe: withFilter(
                (payload, variables, context, info) => {
                    return pubsub.asyncIterator("LotteryGameQuotaUpdatedSubscription");
                },
                (payload, variables, context, info) => {
                    return true;
                }
            )
        },
        LotteryGameQuotaNumberUpdatedSubscription: {
            subscribe: withFilter(
                (payload, variables, context, info) => {
                    return pubsub.asyncIterator("LotteryGameQuotaNumberUpdatedSubscription");
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
        backendEventName: 'LotteryGameQuotaUpdatedSubscription',
        gqlSubscriptionName: 'LotteryGameQuotaUpdatedSubscription',
        dataExtractor: (evt) => evt.data,// OPTIONAL, only use if needed
        onError: (error, descriptor) => console.log(`Error processing ${descriptor.backendEventName}`),// OPTIONAL, only use if needed
        onEvent: (evt, descriptor) => console.log(`Event of type  ${descriptor.backendEventName} arraived`),// OPTIONAL, only use if needed
    },
    {
        backendEventName: 'LotteryGameQuotaNumberUpdatedSubscription',
        gqlSubscriptionName: 'LotteryGameQuotaNumberUpdatedSubscription',
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


