"use strict";
// RXJS
const { of, interval, forkJoin, from } = require("rxjs");
const { take, mergeMap, catchError, map, toArray, filter, tap } = require("rxjs/operators");
// Data access
const { LotteryCalendarDA, LotteryDrawDA, LotteryGameDA,
  LotterySheetConfigDA, LotteryPrizeProgramDA, LotteryQuotaDA }=  require("./data-access");
//Tools
const broker = require("../../tools/broker/BrokerFactory")();
const Crosscutting = require("../../tools/Crosscutting");
const { Event } = require("@nebulae/event-store");
const eventSourcing = require("../../tools/EventSourcing")();
const uuidv4 = require("uuid/v4");
// Custom Errors
const {
  MISSING_SHEET_TO_OPEN_DRAW,
  MISSING_PRIZE_PROGRAM_TO_OPEN_DRAW,
  MISSING_QUOTA_CONFIG_TO_OPEN_DRAW
} =  require('../../tools/customError');

class CronJobEsHelper {
  static searchConfigurationToOpenADraw$(drawCalendar) {

    return from(drawCalendar.dateCalendar).pipe(
      map(dateCalendar => ({ ...drawCalendar, dateCalendar })),
      mergeMap(calendar =>
        forkJoin(
          of(calendar),
          LotteryDrawDA.findLastVersionByGameId$(calendar.gameId),
          LotteryGameDA.findById$(calendar.gameId)
        )
      ),
      mergeMap(([calendar, nextDrawNumber, gameName]) =>
        forkJoin(
          of(calendar),
          of(gameName),
          of(nextDrawNumber),
          this.searchSheetConfig$(calendar, nextDrawNumber),
          this.searchPrizeProgram$(calendar, nextDrawNumber),
          this.searchQuotaConfig$(calendar, nextDrawNumber)
        )
      ),
      catchError(err => {
        // TODO
        console.log(" ====> ", err);
        return of(null);
      }),
      filter(r => r),
      mergeMap(([calendar, gameName, nextDrawNumber, sheet, prize, quota]) =>
        this.buildCompleteDrawObject$(calendar, gameName, nextDrawNumber, sheet, prize, quota )
      )
    );
  }

  static searchSheetConfig$(drawCalendar, nextDrawNumber) {
    return LotterySheetConfigDA.findValidConfigurationToOpenDraw$(
      drawCalendar.lotteryId,
      drawCalendar.gameId,
      nextDrawNumber
    ).pipe(
      tap(settings => {
        if (settings.length == 0) {
          throw MISSING_SHEET_TO_OPEN_DRAW;
        }
      }),
      map(settings => settings[0])
    );
  }

  static searchPrizeProgram$(drawCalendar, nextDrawNumber) {
    return LotteryPrizeProgramDA.findValidConfigurationToOpenDraw$(
      drawCalendar.lotteryId,
      drawCalendar.gameId,
      nextDrawNumber
    ).pipe(
      tap(settings => {
        if (settings.length == 0) {
          throw MISSING_PRIZE_PROGRAM_TO_OPEN_DRAW;
        }
      }),
      map(settings => settings[0])
    );
  }

  static searchQuotaConfig$(drawCalendar, nextDrawNumber) {
    return LotteryQuotaDA.findValidConfigurationToOpenDraw$(
      drawCalendar.lotteryId,
      drawCalendar.gameId,
      nextDrawNumber
    ).pipe(
      tap(settings => {
        if (settings.length == 0) {
          throw MISSING_QUOTA_CONFIG_TO_OPEN_DRAW;
        }
      }),
      map(settings => settings[0])
    );
  }

  static buildCompleteDrawObject$(calendar, gameName, nextDrawNumber, sheet, prize, quota ) {

    const allSecondaryPrizes = prize.secondaryPrices.reduce(
      (acc, current, i) => [
        ...acc,
        ...new Array(current.quantity).fill({
          name: current.name,
          number: "",
          series: current.withSerie ? "" : null
        })
      ],
      []
    );
    const allTwoOutOfThree = {
      name: prize.twoOutOfThree.name,
      pairs: new Array(3).fill({ number: "", series: "" })
    };

    return of({ allSecondaryPrizes, allTwoOutOfThree }).pipe(
      map(blankPrixes => ({
        _id: uuidv4(),
        lotteryId: calendar.lotteryId,
        gameId: calendar.gameId,
        gameName: gameName,
        active: true,
        sheetConfigId: sheet._id,
        prizeProgramId: prize._id,
        drawCalendarId: calendar._id,
        quotaId: quota._id,
        sheetConfigVersion: sheet.version,
        prizeProgramVersion: prize.version,
        drawCalendarVersion: calendar.version,
        quotaVersion: quota.version,
        drawNumber: nextDrawNumber,
        state: "OPEN",
        openingDate: Date.now(),
        ClosingDate: null,
        results: {
          grandPrize: {
            number: "",
            series: ""
          },
          secondaryPrizes: blankPrixes.allSecondaryPrizes,
          TwoOutOfThree: blankPrixes.allTwoOutOfThree
        },
        approved: null,
        approvedTimestamp: null,
        approvedUserId: null,
        approvedUsername: null,
        approvedNotes: null,
        openFromTimestamp: calendar.dateCalendar.openingDatetime,
        openUntilTimestamp: calendar.dateCalendar.closingDatetime
      })),
      tap(draw => console.log(JSON.stringify(draw))),
      mergeMap(draw => LotteryDrawDA.insertDraw$(draw))
    );
  }
}
/**
 * @returns {CronJobEsHelper}
 */
module.exports = CronJobEsHelper