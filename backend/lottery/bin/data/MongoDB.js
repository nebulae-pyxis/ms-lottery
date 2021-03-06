"use strict";

const Rx = require("rxjs");
const MongoClient = require("mongodb").MongoClient;
let instance = null;
const { map } = require("rxjs/operators");
const { of, bindNodeCallback, Observable } = require("rxjs");

class MongoDB {
  /**
   * initialize and configure Mongo DB
   * @param { { url, dbName } } ops
   */
  constructor({ url, dbName }) {
    this.url = url;
    this.dbName = dbName;
  }

  /**
   * Starts DB connections
   * @returns {Rx.Observable} Obserable that resolve to the DB client
   */
  start$() {
    console.log("MongoDB.start$()... ");
    return bindNodeCallback(MongoClient.connect)(this.url).pipe(
      map(client => {
        console.log(this.url);
        this.client = client;
        this.db = this.client.db(this.dbName);
        return `MongoDB connected to dbName= ${this.dbName}`;
      })
    );
  }

  /**
   * Stops DB connections
   * Returns an Obserable that resolve to a string log
   */
  stop$() {
    return Observable.create(observer => {
      this.client.close();
      observer.next("Mongo DB Client closed");
      observer.complete();
    });
  }

  /**
   * Ensure Index creation
   * Returns an Obserable that resolve to a string log
   */
  createIndexes$() {
    return Observable.create(async observer => {
      observer.next('Creating index for lottery.Lottery => ({ _id: 1, creationTimestamp: 1})  ');
      await this.db.collection('Lottery').createIndex({ _id: 1, creationTimestamp: 1 });
      
      observer.next('Creating index for lottery.LotteryGame => ({ _id: 1, creationTimestamp: 1})  ');
      await this.db.collection('LotteryGame').createIndex( { _id: 1, creationTimestamp: 1});

      observer.next('Creating index for lottery.LotteryGameDrawCalendar => ({ gameId: 1 })  ');
      await this.db.collection('LotteryGameDrawCalendar').createIndex({ gameId: 1 });
      
      observer.next('Creating index for lottery.LotteryGamePrizeProgram => ({ gameId: 1 })  ');
      await this.db.collection('LotteryGamePrizeProgram').createIndex({ gameId: 1 });
      
      observer.next('Creating index for lottery.LotteryGameSheetConfig => ({ gameId: 1 })  ');
      await this.db.collection('LotteryGameSheetConfig').createIndex({ gameId: 1 });
      
      observer.next('Creating index for lottery.LotteryGameSheetConfig => ({ gameId: 1 })  ');
      await this.db.collection('LotteryGameSheetConfig').createIndex( { creationTimestamp: 1});

      observer.next("All indexes created");
      observer.complete();
    });
  }

  /**
   * extracts every item in the mongo cursor, one by one
   * @param {*} cursor
   */
  extractAllFromMongoCursor$(cursor) {
    return Observable.create(async observer => {
      let obj = await MongoDB.extractNextFromMongoCursor(cursor);
      while (obj) {
        observer.next(obj);
        obj = await MongoDB.extractNextFromMongoCursor(cursor);
      }
      observer.complete();
    });
  }

  /**
   * Extracts the next value from a mongo cursos if available, returns undefined otherwise
   * @param {*} cursor
   */
  static async extractNextFromMongoCursor(cursor) {
    const hasNext = await cursor.hasNext();
    if (hasNext) {
      const obj = await cursor.next();
      return obj;
    }
    return undefined;
  }
}

module.exports = {
  MongoDB,
  singleton() {
    if (!instance) {
      instance = new MongoDB({
        url: process.env.MONGODB_URL,
        dbName: process.env.MONGODB_DB_NAME
      });
      console.log(`MongoDB instance created: ${process.env.MONGODB_DB_NAME}`);
    }
    return instance;
  }
};
