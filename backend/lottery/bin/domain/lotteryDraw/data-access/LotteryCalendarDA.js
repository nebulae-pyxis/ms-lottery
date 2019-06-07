"use strict";

let mongoDB = undefined;
const COLLECTION_NAME = "LotteryGameDrawCalendar";
const { map } = require("rxjs/operators");
const { of, Observable, defer } = require("rxjs");

class LotteryCalendarDA {
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
    return defer(() => collection.findOne(query, { projection }));
  }

  static updateDrawStateInCalendar$(calendarId, drawId, state){
    const collection = mongoDB.db.collection(COLLECTION_NAME);
    return defer(() => collection.updateOne(
      { _id: calendarId, "dateCalendar.id": drawId },
      { $set: { "dateCalendar.$.drawState": state } }  
      ))
  }
}
/**
 * @returns {LotteryCalendarDA}
 */
module.exports = LotteryCalendarDA;
