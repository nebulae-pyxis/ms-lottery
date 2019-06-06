"use strict";

let mongoDB = undefined;
const COLLECTION_NAME = "LotteryDraws";
const { CustomError } = require("../../../tools/customError");
const { map } = require("rxjs/operators");
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

  /**
   * Gets Driver by its _id
   */
  static findById$(_id, projection = undefined) {
    const collection = mongoDB.db.collection(COLLECTION_NAME);
    const query = { _id };
    return defer(() => collection.findOne(query, { projection }));
  }

  static insertOne$(draw) {
    const collection = mongoDB.db.collection(COLLECTION_NAME);
    return defer(() => collection.insertOne(draw));
  }

  static updateState$(drawId, state) {
    const collection = mongoDB.db.collection(COLLECTION_NAME);
    return defer(() =>
      collection.updateOne({ _id: drawId }, { $set: { state } })
    );
  }
}
/**
 * @returns {LotteryDrawDA}
 */
module.exports = LotteryDrawDA;
