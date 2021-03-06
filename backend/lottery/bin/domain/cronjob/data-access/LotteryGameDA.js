"use strict";

let mongoDB = undefined;
const COLLECTION_NAME = "LotteryGame";
const { CustomError } = require("../../../tools/customError");
const { map } = require("rxjs/operators");
const { of, Observable, defer } = require("rxjs");

class LotteryGameDA {
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
    return defer(() => collection.findOne(query,{projection}));
  }
  
  
  static findActiveByLotteryId$(lotteryId){
    const collection = mongoDB.db.collection(COLLECTION_NAME);
    return defer(() => collection
    .find({ state: true, "generalInfo.lotteryId": lotteryId })
    .toArray())
  }

}
/**
 * @returns {LotteryGameDA}
 */
module.exports = LotteryGameDA;
