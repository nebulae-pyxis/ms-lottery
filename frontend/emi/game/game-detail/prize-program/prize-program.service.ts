import { Injectable } from '@angular/core';
import { Observable, BehaviorSubject, of, Subject, from } from 'rxjs';
import { startWith, tap, mergeMap, map, reduce } from 'rxjs/operators';
import { GatewayService } from '../../../../../api/gateway.service';
import {
  LotteryGamePrizeProgramList,
  LotteryGamePrizeProgram,
  CreateLotteryGamePrizeProgram,
  UpdateLotteryGamePrizeProgram,
  ApproveLotteryGamePrizeProgram,
  RevokeLotteryGamePrizeProgram,
  LotteryGamePrizeProgramUpdatedSubscription
} from '../../gql/prize-program.js';
import { Router, ActivatedRoute } from '@angular/router';

import { Location } from '@angular/common';

@Injectable({
  providedIn: 'root',
})
export class PrizeProgramService {

  lastOperation = null;

  prizeProgram = null;
  notifyPrizeProgramUpdated$ = new Subject();
  selectedPrizeProgramChanged$ = new BehaviorSubject(undefined);
  grandPrize;
  grandPrizeFormValid$ = new BehaviorSubject(false);
  twoOutOfThree;
  secondaryPrices = [];

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
        this.prizeProgram = game;
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
        this.prizeProgram = game;
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
        this.prizeProgram = null;
      })
    );
  }

  /* #region  PRIZE PROGRAM CQRS */
  lotteryGamePrizeProgramList$(filterInput) {
    return this.gateway.apollo.query<any>({
      query: LotteryGamePrizeProgramList,
      variables: {
        filterInput
      },
      fetchPolicy: 'network-only',
      errorPolicy: 'all'
    });
  }

  lotteryGamePrizeProgram$(id, filterInput) {
    return this.gateway.apollo.query<any>({
      query: LotteryGamePrizeProgram,
      variables: {
        id,
        filterInput
      },
      fetchPolicy: 'network-only',
      errorPolicy: 'all'
    });
  }

  createLotteryGamePrizeProgram$(input) {
    return this.gateway.apollo.mutate<any>({
      mutation: CreateLotteryGamePrizeProgram,
      variables: {
        input
      },
      errorPolicy: 'all'
    });
  }

  updateLotteryGamePrizeProgram$(id, input) {
    return this.gateway.apollo.mutate<any>({
      mutation: UpdateLotteryGamePrizeProgram,
      variables: {
        id,
        input
      },
      errorPolicy: 'all'
    });
  }

  approveLotteryGamePrizeProgram$(id, approved, approvedNotes) {
    return this.gateway.apollo.mutate<any>({
      mutation: ApproveLotteryGamePrizeProgram,
      variables: {
        id,
        approved,
        approvedNotes
      },
      errorPolicy: 'all'
    });
  }

  revokeLotteryGamePrizeProgram$(id, revoked, revokedNotes) {
    return this.gateway.apollo.mutate<any>({
      mutation: RevokeLotteryGamePrizeProgram,
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
    this.notifyPrizeProgramUpdated$.next(filterData);
  }

  /**
 * Event triggered when a lotteryGame is created, updated or deleted.
 */
  subscribeLotteryGamePrizeProgramUpdatedSubscription$(): Observable<any> {
    return this.gateway.apollo
      .subscribe({
        query: LotteryGamePrizeProgramUpdatedSubscription
      });
  }

}
