const withFilter = require("graphql-subscriptions").withFilter;
const PubSub = require("graphql-subscriptions").PubSub;
const pubsub = new PubSub();
const broker = require("../../broker/BrokerFactory")();
const superagent = require('superagent');
const { of, Observable, defer } = require('rxjs');
const { map, mergeMap, catchError, tap } = require('rxjs/operators');

function getResponseFromBackEnd$(response) {
    return of(response)
    .pipe(
        map(resp => {
            if (resp.result.code != 200) {
                const err = new Error();
                err.name = 'Error';
                err.message = resp.result.error;
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
        getSamData(root, args, context) {
            const timestamp = parseInt(new Date().getTime()/1000)
            return of(args)
            .pipe(
                mergeMap(data => {
                    return defer(() => {
                        const cardId = data.cardId;
                        const id = (Math.floor(Math.random() * (9000 - 0)) + 0);
                        return superagent
                            .post('http://websam.default.svc.cluster.local:8000/recharge/' + id)
                            .send({ "id":  id, "timestamp": timestamp, 
                            "tagid": parseInt(cardId), "value": args.value })
                            .set('accept', 'json')
                    })
                }),
                map(result => JSON.parse(result.res.text)),
                tap(logTest => console.log('llega del del rest: ',logTest))
            )
            .toPromise();
        }
    },

    //// MUTATIONS ///////


    //// SUBSCRIPTIONS ///////
};



//// SUBSCRIPTIONS SOURCES ////

const eventDescriptors = [
    {
        backendEventName: 'AfccQrReloadHelloWorldEvent',
        gqlSubscriptionName: 'AfccQrReloadHelloWorldSubscription',
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
                    `${descriptor.gqlSubscriptionName} listener STOPED`
                )
        );
});

