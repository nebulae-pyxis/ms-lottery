import { Injectable } from '@angular/core';
import { Observable, BehaviorSubject, of, Subject, from } from 'rxjs';
import { startWith, tap, mergeMap, map, reduce } from 'rxjs/operators';
import { GatewayService } from '../../../../../api/gateway.service';
import {
  LotteryGameQuotaList,
  LotteryGameQuota,
  CreateLotteryGameQuota,
  UpdateLotteryGameQuota,
  ApproveLotteryGameQuota,
  RevokeLotteryGameQuota,
  CreateLotteryGameQuotaNumber,
  RemoveLotteryGameQuotaNumber,
  LotteryGameQuotaUpdatedSubscription,
  LotteryGameQuotaNumberUpdatedSubscription
} from '../../gql/quota.js';
import { Router, ActivatedRoute } from '@angular/router';
import { HttpClient, HttpParams, HttpRequest, HttpEvent } from '@angular/common/http';

import { Location } from '@angular/common';

@Injectable({
  providedIn: 'root',
})
export class QuotaService {

  lastOperation = null;

  quota = null;
  notifyQuotaUpdated$ = new Subject();
  selectedQuotaChanged$ = new BehaviorSubject(undefined);
  grandPrize;
  grandPrizeFormValid$ = new BehaviorSubject(false);
  twoOutOfThree;
  secondaryPrices = [];
  approximations = [];
  fileQuotaList = [];
  currentUploadProgress$ = new BehaviorSubject(0);

  constructor(private gateway: GatewayService, private location: Location,
    private route: ActivatedRoute,
    private http: HttpClient) {

  }

  /**
   * Registers an operation, this is useful to indicate that we are waiting for the response of the CREATE operation
   */
  createOperation$(game: any) {
    return of('CREATE').pipe(
      tap(operation => {
        this.lastOperation = operation;
        this.quota = game;
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
        this.quota = game;
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
        this.quota = null;
      })
    );
  }

  /* #region  PRIZE PROGRAM CQRS */
  lotteryGameQuotaList$(filterInput) {
    return this.gateway.apollo.query<any>({
      query: LotteryGameQuotaList,
      variables: {
        filterInput
      },
      fetchPolicy: 'network-only',
      errorPolicy: 'all'
    });
  }

  lotteryGameQuota$(id, filterInput) {
    return this.gateway.apollo.query<any>({
      query: LotteryGameQuota,
      variables: {
        id,
        filterInput
      },
      fetchPolicy: 'network-only',
      errorPolicy: 'all'
    });
  }

  createLotteryGameQuota$(input) {
    return this.gateway.apollo.mutate<any>({
      mutation: CreateLotteryGameQuota,
      variables: {
        input
      },
      errorPolicy: 'all'
    });
  }

  updateLotteryGameQuota$(id, input) {
    return this.gateway.apollo.mutate<any>({
      mutation: UpdateLotteryGameQuota,
      variables: {
        id,
        input
      },
      errorPolicy: 'all'
    });
  }

  approveLotteryGameQuota$(id, approved, approvedNotes) {
    return this.gateway.apollo.mutate<any>({
      mutation: ApproveLotteryGameQuota,
      variables: {
        id,
        approved,
        approvedNotes
      },
      errorPolicy: 'all'
    });
  }

  revokeLotteryGameQuota$(id, revoked, revokedNotes) {
    return this.gateway.apollo.mutate<any>({
      mutation: RevokeLotteryGameQuota,
      variables: {
        id,
        revoked,
        revokedNotes
      },
      errorPolicy: 'all'
    });
  }

  createLotteryGameQuotaNumber$(input, lotteryId, gameId, quotaId) {
    return this.gateway.apollo.mutate<any>({
      mutation: CreateLotteryGameQuotaNumber,
      variables: {
        input,
        lotteryId,
        gameId,
        quotaId
      },
      errorPolicy: 'all'
    });
  }

  removeLotteryGameQuotaNumber$(quotaId) {
    return this.gateway.apollo.mutate<any>({
      mutation: RemoveLotteryGameQuotaNumber,
      variables: {
        quotaId: quotaId
      },
      errorPolicy: 'all'
    });
  }
  /* #endregion */


  notifymsentityUpdated(filterData) {
    this.notifyQuotaUpdated$.next(filterData);
  }

  /**
 * Event triggered when a lotteryGame is created, updated or deleted.
 */
  subscribeLotteryGameQuotaUpdatedSubscription$(): Observable<any> {
    return this.gateway.apollo
      .subscribe({
        query: LotteryGameQuotaUpdatedSubscription
      });
  }
  /**
* Event triggered when a lotteryGame is created, updated or deleted.
*/
  subscribeLotteryGameQuotaNumberUpdatedSubscription$(): Observable<any> {
    return this.gateway.apollo
      .subscribe({
        query: LotteryGameQuotaNumberUpdatedSubscription
      });
  }

}
