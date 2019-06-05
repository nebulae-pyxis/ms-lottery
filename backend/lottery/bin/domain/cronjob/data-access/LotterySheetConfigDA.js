"use strict";

let mongoDB = undefined;
const COLLECTION_NAME = "LotteryGameSheetConfig";
const { CustomError } = require("../../../tools/customError");
const { map } = require("rxjs/operators");
const { of, Observable, defer } = require("rxjs");

class LotterySheetConfigDA {

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

  /**
   * Gets Driver by its _id
   */
  static findById$(_id, projection = undefined) {
    const collection = mongoDB.db.collection(COLLECTION_NAME);
    const query = { _id };
    return defer(() => collection.findOne(query,{projection}));
  }

  static findValidConfigurationToOpenDraw$(lotteryId, gameId, drawNumber){
    const collection = mongoDB.db.collection(COLLECTION_NAME);
    return defer(() => collection.find({
      revoked: false,
      approved: "APPROVED", lotteryId, gameId, 
      validFromDraw: { $lte: drawNumber },
      $or: [
        { validUntilDraw: null },
        { validUntilDraw: { $gte: drawNumber } }
      ]      
    })
    .sort({ version: -1 })
    .limit(1)
    .toArray()
    )

  }

}
/**
 * @returns {LotterySheetConfigDA}
 */
module.exports = LotterySheetConfigDA;
