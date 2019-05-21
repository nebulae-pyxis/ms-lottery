import { Injectable } from '@angular/core';
import { Observable, BehaviorSubject, of, Subject, from } from 'rxjs';
import { startWith, tap, mergeMap, map, reduce } from 'rxjs/operators';
import { GatewayService } from '../../../../api/gateway.service';
import {
  LotteryCreateGame,
  LotteryUpdateGameGeneralInfo,
  LotteryUpdateGameState,
  LotteryGame,
  LotteryGameUpdatedSubscription,
  LotteriesFilterInput,
  LotteryLottery,
  RevokeLotteryGameSheetConfig,
  ApproveLotteryGameSheetConfig,
  UpdateLotteryGameSheetConfig,
  CreateLotteryGameSheetConfig,
  LotteryGameSheetConfig,
  LotteryGameSheetConfigList,
  LotteryGameSheetConfigUpdatedSubscription
} from '../gql/game.js';
import { Router, ActivatedRoute } from '@angular/router';

import { Location } from '@angular/common';

@Injectable()
export class GameDetailService {

  lastOperation = null;

  game = null;

  notifyLotteryGameUpdated$ = new Subject();

  selectedConfigSheetChanged$ = new BehaviorSubject(undefined);

  constructor(private gateway: GatewayService, private location: Location,
    private route: ActivatedRoute) {

  }

  /**
   * Registers an operation, this is useful to indicate that we are waiting for the response of the CREATE operation
   */
  createOperation$(game: any) {
    return of('CREATE').pipe(
      tap(operation => {
        this.lastOperation = operation;
        this.game = game;
      })
    );
  }

  /**
   * Registers an operation, this is useful to indicate that we are waiting for the response of the UPDATE operation
   */
  updateOperation$(game: any) {
    return of('UPDATE').pipe(
      tap(operation => {
        this.lastOperation = operation;
        this.game = game;
      })
    );
  }

  /**
   * Unregisters an operation, this is useful to indicate that we are not longer waiting for the response of the last operation
   */
  resetOperation$() {
    return of('').pipe(
      tap(() => {
        this.lastOperation = null;
        this.game = null;
      })
    );
  }
  /* #region  GAME CQRS */

  getLotteryLottery$(entityId: string) {
    return this.gateway.apollo.query<any>({
      query: LotteryLottery,
      variables: {
        id: entityId
      },
      fetchPolicy: 'network-only',
      errorPolicy: 'all'
    });
  }

  /**
   * Gets the lottery list
   * @param filter Data to filter the list
   * @param paginator Object that contains info about page number and amount of records to recover
   * @returns {Observable} Observable with the lottery list
   */
  LotteriesFilterInput$(filterText, paginatorInput) {
    return this.gateway.apollo.query<any>({
      query: LotteriesFilterInput,
      variables: {
        filterInput: { name: filterText },
        paginationInput: paginatorInput
      },
      fetchPolicy: 'network-only',
      errorPolicy: 'all'
    });
  }

  createLotteryGame$(game: any) {
    return this.createOperation$(game)
      .pipe(
        mergeMap(() => {
          return this.gateway.apollo
            .mutate<any>({
              mutation: LotteryCreateGame,
              variables: {
                input: game
              },
              errorPolicy: 'all'
            });
        })
      );
  }

  updateLotteryGameGeneralInfo$(id: String, gameGeneralInfo: any) {
    console.log('update generalInfo: ', gameGeneralInfo);
    return this.updateOperation$(gameGeneralInfo)
      .pipe(
        mergeMap(() => {
          return this.gateway.apollo
            .mutate<any>({
              mutation: LotteryUpdateGameGeneralInfo,
              variables: {
                id: id,
                input: gameGeneralInfo
              },
              errorPolicy: 'all'
            });
        })
      );
  }

  updateLotteryGameState$(id: String, newState: boolean) {
    return this.gateway.apollo
      .mutate<any>({
        mutation: LotteryUpdateGameState,
        variables: {
          id: id,
          newState: newState
        },
        errorPolicy: 'all'
      });
  }

  getLotteryGame$(entityId: string) {
    return this.gateway.apollo.query<any>({
      query: LotteryGame,
      variables: {
        id: entityId
      },
      fetchPolicy: 'network-only',
      errorPolicy: 'all'
    });
  }

  /**
 * Event triggered when a lotteryGame is created, updated or deleted.
 */
  subscribeLotteryGameUpdatedSubscription$(): Observable<any> {
    return this.gateway.apollo
      .subscribe({
        query: LotteryGameUpdatedSubscription
      });
  }

  /**
 * Event triggered when a lotteryGame is created, updated or deleted.
 */
  subscribeLotteryGameSheetConfigUpdatedSubscription$(): Observable<any> {
    return this.gateway.apollo
      .subscribe({
        query: LotteryGameSheetConfigUpdatedSubscription
      });
  }
  /* #endregion */

  /* #region  SHEET CONFIG CQRS */
  lotteryGameSheetConfigList$(filterInput) {
    return this.gateway.apollo.query<any>({
      query: LotteryGameSheetConfigList,
      variables: {
        filterInput
      },
      fetchPolicy: 'network-only',
      errorPolicy: 'all'
    });
  }

  lotteryGameSheetConfig$(id, filterInput) {
    return this.gateway.apollo.query<any>({
      query: LotteryGameSheetConfig,
      variables: {
        id,
        filterInput
      },
      fetchPolicy: 'network-only',
      errorPolicy: 'all'
    });
  }

  createLotteryGameSheetConfig$(input) {
    return this.gateway.apollo.mutate<any>({
      mutation: CreateLotteryGameSheetConfig,
      variables: {
        input
      },
      errorPolicy: 'all'
    });
  }

  updateLotteryGameSheetConfig$(id, input) {
    return this.gateway.apollo.mutate<any>({
      mutation: UpdateLotteryGameSheetConfig,
      variables: {
        id,
        input
      },
      errorPolicy: 'all'
    });
  }

  approveLotteryGameSheetConfig$(id, approved, approvedNotes) {
    return this.gateway.apollo.mutate<any>({
      mutation: ApproveLotteryGameSheetConfig,
      variables: {
        id,
        approved,
        approvedNotes
      },
      errorPolicy: 'all'
    });
  }

  revokeLotteryGameSheetConfig$(id, revoked, revokedNotes) {
    return this.gateway.apollo.mutate<any>({
      mutation: RevokeLotteryGameSheetConfig,
      variables: {
        id,
        revoked,
        revokedNotes
      },
      errorPolicy: 'all'
    });
  }
  /* #endregion */


  notifymsentityUpdated(filterData) {
    this.notifyLotteryGameUpdated$.next(filterData);
  }

}
