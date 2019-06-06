"use strict";

let mongoDB = undefined;
const COLLECTION_NAME = "Lottery";
const { map } = require("rxjs/operators");
const { of, Observable, defer } = require("rxjs");

class LotteryDA {

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

  static findActiveLotteries$(){
    const collection = mongoDB.db.collection(COLLECTION_NAME);
    return defer(() => collection
    .find({active: true})
    .toArray()
    )
  }

}
/**
 * @returns {LotteryDA}
 */
module.exports = LotteryDA;
