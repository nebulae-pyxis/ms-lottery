"use strict";

let mongoDB = undefined;
const COLLECTION_NAME = "LotteryDraws";
const { CustomError } = require("../../../tools/customError");
const { map, tap } = require("rxjs/operators");
const { of, Observable, defer } = require("rxjs");

class LotteryDrawDA {
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

  static findLastVersionByGameId$(gameId){    
    const collection = mongoDB.db.collection(COLLECTION_NAME);
    return defer(() =>
      collection.find({ gameId }, { drawNumber: 1 })
      .sort({ drawNumber: -1 })
      .limit(1)
      .toArray()
    )
    .pipe(
      map(results => results.length === 0 ? 1 : results[0].drawNumber +1 )
    )
  }


}
/**
 * @returns {LotteryDrawDA}
 */
module.exports = LotteryDrawDA;
