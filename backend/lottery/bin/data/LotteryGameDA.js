"use strict";

let mongoDB = undefined;
//const mongoDB = require('./MongoDB')();
const CollectionName = "LotteryGame";
const { CustomError } = require("../tools/customError");
const LotteryDA = require("./LotteryDA");
const { map, tap, mergeMap, toArray } = require("rxjs/operators");
const { of, Observable, defer, from } = require("rxjs");

class LotteryGameDA {
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

  /**
   * Gets an user by its id
   */
  static getLotteryGame$(id) {
    const collection = mongoDB.db.collection(CollectionName);

    const query = {
      _id: id
    };

    return defer(() => collection.findOne(query));
  }

  static getLotteryGameList$(filter, pagination) {
    const collection = mongoDB.db.collection(CollectionName);

    const query = {
    };
    if (filter.name) {
      query["generalInfo.name"] = { $regex: filter.name, $options: "i" };
    }

    if (filter.creationTimestamp) {
      query.creationTimestamp = filter.creationTimestamp;
    }

    if (filter.lotteryId) {
      query["generalInfo.lotteryId"] = filter.lotteryId;
    }

    if (filter.creatorUser) {
      query.creatorUser = { $regex: filter.creatorUser, $options: "i" };
    }

    if (filter.modifierUser) {
      query.modifierUser = { $regex: filter.modifierUser, $options: "i" };
    }

    console.log(query);
    const cursor = collection
      .find(query)
      .skip(pagination.count * pagination.page)
      .limit(pagination.count)
      .sort({ creationTimestamp: pagination.sort });

    return mongoDB.extractAllFromMongoCursor$(cursor).pipe(
      mergeMap(lotteryGame => {
        return LotteryDA.getLottery$(lotteryGame.generalInfo.lotteryId).pipe(
          map(lottery => { 
            return  lottery? ({ ...lotteryGame, generalInfo: {...lotteryGame.generalInfo, lotteryName: lottery.generalInfo.name} }) : undefined;
          }
          )
        )
      })
    );
  }

  static getLotteryGameSize$(filter) {
    const collection = mongoDB.db.collection(CollectionName);

    const query = {
    };

    if (filter.name) {
      query["generalInfo.name"] = { $regex: filter.name, $options: "i" };
    }

    if (filter.creationTimestamp) {
      query.creationTimestamp = filter.creationTimestamp;
    }

    if (filter.creatorUser) {
      query.creatorUser = { $regex: filter.creatorUser, $options: "i" };
    }

    if (filter.modifierUser) {
      query.modifierUser = { $regex: filter.modifierUser, $options: "i" };
    }

    return collection.count(query);
  }

  /**
   * Creates a new LotteryGame
   * @param {*} lotteryGame lotteryGame to create
   */
  static createLotteryGame$(lotteryGame) {
    const collection = mongoDB.db.collection(CollectionName);
    return defer(() => collection.insertOne(lotteryGame));
  }

  /**
* modifies the general info of the indicated LotteryGame 
* @param {*} id  LotteryGame ID
* @param {*} LotteryGameGeneralInfo  New general information of the LotteryGame
*/
  static updateLotteryGameGeneralInfo$(id, LotteryGameGeneralInfo) {
    const collection = mongoDB.db.collection(CollectionName);

    return defer(() =>
      collection.findOneAndUpdate(
        { _id: id },
        {
          $set: { generalInfo: LotteryGameGeneralInfo.generalInfo, modifierUser: LotteryGameGeneralInfo.modifierUser, modificationTimestamp: LotteryGameGeneralInfo.modificationTimestamp }
        }, {
          returnOriginal: false
        }
      )
    ).pipe(
      map(result => result && result.value ? result.value : undefined)
    );
  }

  /**
   * Updates the LotteryGame state 
   * @param {string} id LotteryGame ID
   * @param {boolean} newLotteryGameState boolean that indicates the new LotteryGame state
   */
  static updateLotteryGameState$(id, newLotteryGameState) {
    const collection = mongoDB.db.collection(CollectionName);

    return defer(() =>
      collection.findOneAndUpdate(
        { _id: id },
        {
          $set: { state: newLotteryGameState.state, modifierUser: newLotteryGameState.modifierUser, modificationTimestamp: newLotteryGameState.modificationTimestamp }
        }, {
          returnOriginal: false
        }
      )
    ).pipe(
      map(result => result && result.value ? result.value : undefined)
    );
  }

}
/**
 * @returns {LotteryGameDA}
 */
module.exports = LotteryGameDA;
