"use strict";

let mongoDB = undefined;
//const mongoDB = require('./MongoDB')();
const CollectionName = "LotteryGameDrawCalendar";
const { CustomError } = require("../tools/customError");
const { map, tap, mergeMap, toArray, first } = require("rxjs/operators");
const { of, Observable, defer, from } = require("rxjs");

class LotteryGameDrawCalendarDA {
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
  static getLotteryGameDrawCalendar$(id) {
    const collection = mongoDB.db.collection(CollectionName);

    const query = {
      _id: id
    };

    return defer(() => collection.findOne(query));
  }

  static getLotteryGameDrawCalendarList$(filter) {
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

  static getLastVersionDrawCalendar(gameId) { 
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
  static createLotteryGameDrawCalendar$(drawCalendar, userInfo) {
    return this.getLastVersionDrawCalendar(drawCalendar.gameId).pipe(
      mergeMap(lastDrawCalendar => {
        const version = lastDrawCalendar && lastDrawCalendar.version ? lastDrawCalendar.version + 1 : 1;
        drawCalendar.version = version;
        drawCalendar.approved = 'PENDING';
        drawCalendar.revoked = false;
        const collection = mongoDB.db.collection(CollectionName);
        return defer(() => collection.insertOne(drawCalendar));
      })
    )
  }

  /**
* modifies the general info of the indicated LotteryGame 
* @param {*} id  LotteryGame ID
* @param {*} LotteryGameDrawCalendar  New general information of the LotteryGame
*/
  static updateLotteryGameDrawCalendar$(id, lotteryGameDrawCalendar) {
    const collection = mongoDB.db.collection(CollectionName);
    return defer(() =>
      collection.findOneAndUpdate(
        { _id: id },
        {
          $set: {
            validFromTimestamp: lotteryGameDrawCalendar.validFromTimestamp,
            validUntilTimestamp: lotteryGameDrawCalendar.validUntilTimestamp,
            template: lotteryGameDrawCalendar.template,
            dateCalendar: lotteryGameDrawCalendar.dateCalendar,
            editionTimestamp: lotteryGameDrawCalendar.editionTimestamp,
            editionUserId: lotteryGameDrawCalendar.editionUserId,
            editionUsername: lotteryGameDrawCalendar.editionUsername,
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
  * @param {*} LotteryGameDrawCalendar  New general information of the LotteryGame
  */
  static approveLotteryGameDrawCalendar$({ id, approved, approvedUserId, approvedUsername,
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
* @param {*} LotteryGameDrawCalendar  New general information of the LotteryGame
*/
  static revokeLotteryGameDrawCalendar$({ id, revoked, revokedUserId, revokedUsername,
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
 * @returns {LotteryGameDrawCalendarDA}
 */
module.exports = LotteryGameDrawCalendarDA;
