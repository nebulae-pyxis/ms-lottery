"use strict";

let mongoDB = undefined;
const COLLECTION_NAME = "LotteryQuota";
const { map } = require("rxjs/operators");
const { Observable, defer } = require("rxjs");

class LotteryQuotaDA {

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

  static findValidConfigurationToOpenDraw$(lotteryId, gameId, drawNumber){
    const collection = mongoDB.db.collection(COLLECTION_NAME);
    return defer(() =>
      collection.find({
        revoked: false,
        approved: "APPROVED",
        lotteryId, gameId,
        validFromDraw: { $lte: drawNumber },
        $or: [
          { validUntilDraw: null },
          { validUntilDraw: { $gte: drawNumber } }
        ]
      })
      .sort({ version: -1 })
      .limit(1)
      .toArray()
    );

  }

}
/**
 * @returns {LotteryQuotaDA}
 */
module.exports = LotteryQuotaDA;
