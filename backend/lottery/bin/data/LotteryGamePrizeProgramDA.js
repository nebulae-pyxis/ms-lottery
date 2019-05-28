"use strict";

let mongoDB = undefined;
//const mongoDB = require('./MongoDB')();
const CollectionName = "LotteryGamePrizeProgram";
const { CustomError } = require("../tools/customError");
const { map, tap, mergeMap, toArray, first } = require("rxjs/operators");
const { of, Observable, defer, from } = require("rxjs");

class LotteryGamePrizeProgramDA {
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
  static getLotteryGamePrizeProgram$(id) {
    const collection = mongoDB.db.collection(CollectionName);

    const query = {
      _id: id
    };

    return defer(() => collection.findOne(query));
  }

  static getLotteryGamePrizeProgramList$(filter) {
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

  static getLastVersionPrizeProgram(gameId) { 
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
  static createLotteryGamePrizeProgram$(prizeProgram, userInfo) {
    return this.getLastVersionPrizeProgram(prizeProgram.gameId).pipe(
      mergeMap(lastPrizeProgram => {
        const version = lastPrizeProgram && lastPrizeProgram.version ? lastPrizeProgram.version + 1 : 1;
        prizeProgram.version = version;
        prizeProgram.approved = 'PENDING';
        const collection = mongoDB.db.collection(CollectionName);
        return defer(() => collection.insertOne(prizeProgram));
      })
    )
  }

  /**
* modifies the general info of the indicated LotteryGame 
* @param {*} id  LotteryGame ID
* @param {*} LotteryGamePrizeProgram  New general information of the LotteryGame
*/
  static updateLotteryGamePrizeProgram$(id, lotteryGamePrizeProgram) {
    console.log('llegan parametros editados: ', lotteryGamePrizeProgram);
    const collection = mongoDB.db.collection(CollectionName);
    return defer(() =>
      collection.findOneAndUpdate(
        { _id: id },
        {
          $set: {
            validFromDraw: lotteryGamePrizeProgram.validFromDraw,
            validUntilDraw: lotteryGamePrizeProgram.validUntilDraw,
            prizeClaimThreshold: lotteryGamePrizeProgram.prizeClaimThreshold,
            editionTimestamp: lotteryGamePrizeProgram.editionTimestamp,
            editionUserId: lotteryGamePrizeProgram.editionUserId,
            editionUsername: lotteryGamePrizeProgram.editionUsername,
            grandPrize: lotteryGamePrizeProgram.grandPrize,
            twoOutOfThree: lotteryGamePrizeProgram.twoOutOfThree,
            secondaryPrices: lotteryGamePrizeProgram.secondaryPrices,
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
  * @param {*} LotteryGamePrizeProgram  New general information of the LotteryGame
  */
  static approveLotteryGamePrizeProgram$({ id, approved, approvedUserId, approvedUsername,
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
* @param {*} LotteryGamePrizeProgram  New general information of the LotteryGame
*/
  static revokeLotteryGamePrizeProgram$({ id, revoked, revokedUserId, revokedUsername,
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
 * @returns {LotteryGamePrizeProgramDA}
 */
module.exports = LotteryGamePrizeProgramDA;
