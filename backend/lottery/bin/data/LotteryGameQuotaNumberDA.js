"use strict";

let mongoDB = undefined;
//const mongoDB = require('./MongoDB')();
const CollectionName = "LotteryGameQuotaNumber";
const { CustomError } = require("../tools/customError");
const { map, tap, mergeMap, toArray, first } = require("rxjs/operators");
const { of, Observable, defer, from } = require("rxjs");
const uuidv4 = require("uuid/v4");

class LotteryGameQuotaNumberDA {
  static start$(mongoDbInstance) {
    return Observable.create(observer => {
      if (mongoDbInstance) {
        mongoDB = mongoDbInstance;
        observer.next("using given mongo instance");
      } else {
        mongoDB = require("./MongoDB").singleton();
        observer.next("using singleton system-wide mongo instance");
      }
      observer.complete();
    });
  }

  static getLotteryGameQuotaNumberList$(filter) {
    const collection = mongoDB.db.collection(CollectionName);

    const query = {
    };
    if (filter.quotaId) {
      query.quotaId = filter.quotaId;
    }

    if (filter.gameId) {
      query.gameId = filter.gameId;
    }

    if (filter.lotteryId) {
      query.lotteryId = filter.lotteryId;
    }

    const cursor = collection
      .find(query)
      .sort({ number: 1 });

    return mongoDB.extractAllFromMongoCursor$(cursor);
  }


  static getLotteryGameQuotaNumberListSize$(filter) {
    const collection = mongoDB.db.collection(CollectionName);

    const query = {
    };
    if (filter.quotaId) {
      query.quotaId = filter.quotaId;
    }

    if (filter.gameId) {
      query.gameId = filter.gameId;
    }

    if (filter.lotteryId) {
      query.lotteryId = filter.lotteryId;
    }

    return collection.count(query);
  }

  /**
   * Creates a new LotteryGameQuotaNumber
   * @param {*} quotaNumber lotteryGameQuotaNumber to create
   */
  static createLotteryGameQuotaNumber$(input) {
    const collection = mongoDB.db.collection(CollectionName);
    return from(input.lotteryGameQuotaNumberList).pipe(
      map(quotaNumber => ({ _id: uuidv4(), gameId: input.gameId, lotteryId: input.lotteryId, quotaId: input.quotaId, ...quotaNumber })),
      toArray(),
      mergeMap(quotaNumberListWithId => defer(() => collection.insert(quotaNumberListWithId)))
    );
  }

  /**
   * Removes the filtered by quotaId LotteryGameQuotaNumber
   * @param {*} quotaId lotteryGameQuotaNumber to create
   */
  static removeLotteryGameQuotaNumberByQuotaId$(quotaId) {
    console.log('Entra a remover con el quotaId: ', quotaId);
    const collection = mongoDB.db.collection(CollectionName);
    return defer(() => collection.remove({ 'quotaId': quotaId }))
  }



}
/**
 * @returns {LotteryGameQuotaNumberDA}
 */
module.exports = LotteryGameQuotaNumberDA;
