"use strict";

let mongoDB = undefined;
const COLLECTION_NAME = "LotteryGameDrawCalendar";
const { CustomError } = require("../../../tools/customError");
const { map } = require("rxjs/operators");
const { of, Observable, defer } = require("rxjs");

class LotteryCalendarDA {
  static start$(mongoDbInstance) {
    return Observable.create(observer => {
      if (mongoDbInstance) {
        mongoDB = mongoDbInstance;
        observer.next("using given mongo instance");
      } else {
        mongoDB = require("../../../data/MongoDB").singleton();
        observer.next("using singleton system-wide mongo instance");
      }
      observer.complete();
    });
  }

  static findById$(_id, projection = undefined) {
    const collection = mongoDB.db.collection(COLLECTION_NAME);
    const query = { _id };
    return defer(() => collection.findOne(query, { projection }));
  }

  static findCalendarWithDrawsToOpen$(currentDate, gameId) {
    const collection = mongoDB.db.collection(COLLECTION_NAME);
    return defer(() =>
      collection
        .find(
          {
            gameId,
            revoked: false,
            "dateCalendar.openingDatetime": { $lte: currentDate },
            "dateCalendar.closingDatetime": { $gt: currentDate },
            "dateCalendar.drawState": { $eq: null },
            approved: "APPROVED",
            validFromTimestamp: { $lte: currentDate },
            $or: [
              { validUntilTimestamp: null },
              { validUntilTimestamp: { $gt: currentDate } }
            ]
          },
          {
            projection: { dateCalendar: 1, lotteryId: 1, gameId: 1, version: 1 }
          }
        )
        .sort({ version: -1 })
        .limit(1)
        .toArray()
    ).pipe(
      map(results =>
        results.length == 0
          ? null
          : {
              ...results[0],
              dateCalendar: results[0].dateCalendar.filter(item =>
                item.openingDatetime <= currentDate &&
                item.closingDatetime > currentDate &&
                item.drawState == null
              )
            }
      )
    );
  }
}
/**
 * @returns {LotteryCalendarDA}
 */
module.exports = LotteryCalendarDA;
