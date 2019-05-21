"use strict";

let mongoDB = undefined;
//const mongoDB = require('./MongoDB')();
const CollectionName = "LotteryGameSheetConfig";
const { CustomError } = require("../tools/customError");
const { map, tap, mergeMap, toArray, first } = require("rxjs/operators");
const { of, Observable, defer, from } = require("rxjs");

class LotteryGameSheetConfigDA {
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
  static getLotteryGameSheetConfig$(id) {
    const collection = mongoDB.db.collection(CollectionName);

    const query = {
      _id: id
    };

    return defer(() => collection.findOne(query));
  }

  static getLotteryGameSheetConfigList$(filter) {
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
      query.lotteryId = filter.lotteryId;
    }

    if (filter.gameId) {
      query.gameId = filter.gameId;
    }

    if (filter.creatorUser) {
      query.creatorUser = { $regex: filter.creatorUser, $options: "i" };
    }

    if (filter.modifierUser) {
      query.modifierUser = { $regex: filter.modifierUser, $options: "i" };
    }

    const cursor = collection
      .find(query)
      .sort({ version: -1 });

    return mongoDB.extractAllFromMongoCursor$(cursor);
  }

  static getLastVersionSheetConfig(gameId) { 
    const collection = mongoDB.db.collection(CollectionName);
    const cursor = collection
      .find({ gameId })
      .sort({ version: -1 })
      .limit(1);
    return mongoDB.extractAllFromMongoCursor$(cursor).pipe(
      first(val => val , undefined)
    );
  }

  /**
   * Creates a new LotteryGame
   * @param {*} lotteryGame lotteryGame to create
   */
  static createLotteryGameSheetConfig$(configSheet, userInfo) {
    return this.getLastVersionSheetConfig(configSheet.gameId).pipe(
      mergeMap(lastConfigSheet => {
        const version = lastConfigSheet && lastConfigSheet.version ? lastConfigSheet.version + 1 : 1;
        configSheet.version = version;
        configSheet.approved = 'PENDING';
        const collection = mongoDB.db.collection(CollectionName);
        return defer(() => collection.insertOne(configSheet));
      })
    )
  }

  /**
* modifies the general info of the indicated LotteryGame 
* @param {*} id  LotteryGame ID
* @param {*} LotteryGameSheetConfig  New general information of the LotteryGame
*/
  static updateLotteryGameSheetConfig$(id, lotteryGameSheetConfig) {
    const collection = mongoDB.db.collection(CollectionName);

    return defer(() =>
      collection.findOneAndUpdate(
        { _id: id },
        {
          $set: {
            validFromDraw: lotteryGameSheetConfig.validFromDraw,
            validUntilDraw: lotteryGameSheetConfig.validUntilDraw,
            ticketsPerSheet: lotteryGameSheetConfig.ticketsPerSheet,
            ticketPrice: lotteryGameSheetConfig.ticketPrice,
            editionTimestamp: lotteryGameSheetConfig.editionTimestamp,
            editionUserId: lotteryGameSheetConfig.editionUserId,
            editionUserName: lotteryGameSheetConfig.editionUserName,
            approved: 'PENDING'
          }
        }, {
          returnOriginal: false
        }
      )
    ).pipe(
      map(result => result && result.value ? result.value : undefined)
    );
  }

  /**
  * modifies the general info of the indicated LotteryGame 
  * @param {*} id  LotteryGame ID
  * @param {*} LotteryGameSheetConfig  New general information of the LotteryGame
  */
  static approveLotteryGameSheetConfig$({ id, approved, approvedUserId, approvedUsername,
    approvedNotes, editionUserId, editionUsername, editionTimestamp }) {
    const collection = mongoDB.db.collection(CollectionName);

    return defer(() =>
      collection.findOneAndUpdate(
        { _id: id },
        {
          $set: {
            approved: approved,
            approvedTimestamp: editionTimestamp,
            approvedUserId,
            approvedUsername,
            approvedNotes,
            editionUserId,
            editionUsername,
            editionTimestamp,
          }
        }, {
          returnOriginal: false
        }
      )
    ).pipe(
      map(result => result && result.value ? result.value : undefined)
    );
  }

  /**
* modifies the general info of the indicated LotteryGame 
* @param {*} id  LotteryGame ID
* @param {*} LotteryGameSheetConfig  New general information of the LotteryGame
*/
  static revokeLotteryGameSheetConfig$({ id, revoked, revokedUserId, revokedUsername,
    revokedNotes, editionUserId, editionUsername, editionTimestamp }) {
    const collection = mongoDB.db.collection(CollectionName);

    return defer(() =>
      collection.findOneAndUpdate(
        { _id: id },
        {
          $set: {
            revoked,
            revokedTimestamp: editionTimestamp,
            revokedUserId,
            revokedUsername,
            revokedNotes,
            editionUserId,
            editionUsername,
            editionTimestamp,
          }
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
 * @returns {LotteryGameSheetConfigDA}
 */
module.exports = LotteryGameSheetConfigDA;
