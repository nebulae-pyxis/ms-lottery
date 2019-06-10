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

function verifyUserRoles(context) { 
    return context.authToken.realm_access.roles.some(role => role === 'LOTTERY-ADMIN' || role === 'PLATFORM-ADMIN' || 'LOTTERY-APPROVER');
}

module.exports = {

    //// QUERY ///////

    Query: {
        LotteryGameDrawCalendarList(root, args, context) {
            return RoleValidator.checkPermissions$(context.authToken.realm_access.roles,
                'ms-' + 'Lottery',
                'LotteryGameDrawCalendar',
                PERMISSION_DENIED_ERROR_CODE,
                'Permission denied', ["PLATFORM-ADMIN", "LOTTERY-ADMIN", "LOTTERY-APPROVER"])
                .pipe(
                    mergeMap(() =>
                        broker
                            .forwardAndGetReply$(
                                "LotteryGameDrawCalendar",
                                "emigateway.graphql.query.LotteryGameDrawCalendarList",
                                { root, args, jwt: context.encodedToken },
                                2000
                            )
                    ),
                    catchError(err => handleError$(err, "LotteryGameDrawCalendar")),
                    mergeMap(response => getResponseFromBackEnd$(response))
                ).toPromise();
        },
        LotteryGameDrawCalendar(root, args, context) {
            return RoleValidator.checkPermissions$(context.authToken.realm_access.roles,
                'ms-' + 'Lottery',
                'LotteryGameDrawCalendar',
                PERMISSION_DENIED_ERROR_CODE,
                'Permission denied', ["PLATFORM-ADMIN", "LOTTERY-ADMIN", "LOTTERY-APPROVER"])
                .pipe(
                    mergeMap(() =>
                        broker
                            .forwardAndGetReply$(
                                "LotteryGameDrawCalendar",
                                "emigateway.graphql.query.LotteryGameDrawCalendar",
                                { root, args, jwt: context.encodedToken },
                                2000
                            )
                    ),
                    catchError(err => handleError$(err, "LotteryGameDrawCalendar")),
                    mergeMap(response => getResponseFromBackEnd$(response))
                ).toPromise();
        }
    },

    //// MUTATIONS ///////
    Mutation: {
        CreateLotteryGameDrawCalendar(root, args, context) {
            return RoleValidator.checkPermissions$(
                context.authToken.realm_access.roles,
                "LotteryGameDrawCalendar",
                "CreateLotteryGameDrawCalendar",
                PERMISSION_DENIED_ERROR_CODE,
                "Permission denied",
                ["PLATFORM-ADMIN", "LOTTERY-ADMIN"]
            ).pipe(
                mergeMap(() =>
                    context.broker.forwardAndGetReply$(
                        "LotteryGameDrawCalendar",
                        "emigateway.graphql.mutation.CreateLotteryGameDrawCalendar",
                        { root, args, jwt: context.encodedToken },
                        2000
                    )
                ),
                catchError(err => handleError$(err, "CreateLotteryGameDrawCalendar")),
                mergeMap(response => getResponseFromBackEnd$(response))
            ).toPromise();
        },
        UpdateLotteryGameDrawCalendar(root, args, context) {
            return RoleValidator.checkPermissions$(
                context.authToken.realm_access.roles,
                "LotteryGameDrawCalendar",
                "UpdateLotteryGameDrawCalendar",
                PERMISSION_DENIED_ERROR_CODE,
                "Permission denied",
                ["PLATFORM-ADMIN", "LOTTERY-ADMIN"]
            ).pipe(
                mergeMap(() =>
                    context.broker.forwardAndGetReply$(
                        "LotteryGameDrawCalendar",
                        "emigateway.graphql.mutation.UpdateLotteryGameDrawCalendar",
                        { root, args, jwt: context.encodedToken },
                        2000
                    )
                ),
                catchError(err => handleError$(err, "UpdateLotteryGameDrawCalendar")),
                mergeMap(response => getResponseFromBackEnd$(response))
            ).toPromise();
        },
        ApproveLotteryGameDrawCalendar(root, args, context) {
            return RoleValidator.checkPermissions$(
                context.authToken.realm_access.roles,
                "LotteryGameDrawCalendar",
                "ApproveLotteryGameDrawCalendar",
                PERMISSION_DENIED_ERROR_CODE,
                "Permission denied",
                ["PLATFORM-ADMIN", "LOTTERY-APPROVER"]
            ).pipe(
                mergeMap(() =>
                    context.broker.forwardAndGetReply$(
                        "LotteryGameDrawCalendar",
                        "emigateway.graphql.mutation.ApproveLotteryGameDrawCalendar",
                        { root, args, jwt: context.encodedToken },
                        2000
                    )
                ),
                catchError(err => handleError$(err, "ApproveLotteryGameDrawCalendar")),
                mergeMap(response => getResponseFromBackEnd$(response))
            ).toPromise();
        },
        RevokeLotteryGameDrawCalendar(root, args, context) {
            return RoleValidator.checkPermissions$(
                context.authToken.realm_access.roles,
                "LotteryGameDrawCalendar",
                "RevokeLotteryGameDrawCalendar",
                PERMISSION_DENIED_ERROR_CODE,
                "Permission denied",
                ["PLATFORM-ADMIN", "LOTTERY-APPROVER"]
            ).pipe(
                mergeMap(() =>
                    context.broker.forwardAndGetReply$(
                        "LotteryGameDrawCalendar",
                        "emigateway.graphql.mutation.RevokeLotteryGameDrawCalendar",
                        { root, args, jwt: context.encodedToken },
                        2000
                    )
                ),
                catchError(err => handleError$(err, "RevokeLotteryGameDrawCalendar")),
                mergeMap(response => getResponseFromBackEnd$(response))
            ).toPromise();
        },
    },

    //// SUBSCRIPTIONS ///////
    Subscription: {
        LotteryGameDrawCalendarUpdatedSubscription: {
            subscribe: withFilter(
                (payload, variables, context, info) => {
                    return pubsub.asyncIterator("LotteryGameDrawCalendarUpdatedSubscription");
                },
                (payload, variables, context, info) => {
                    return verifyUserRoles(context);
                }
            )
        }

    }
};



//// SUBSCRIPTIONS SOURCES ////

const eventDescriptors = [
    {
        backendEventName: 'LotteryGameDrawCalendarUpdatedSubscription',
        gqlSubscriptionName: 'LotteryGameDrawCalendarUpdatedSubscription',
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


