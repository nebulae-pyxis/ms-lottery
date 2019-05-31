import { Injectable } from '@angular/core';
import { Observable, BehaviorSubject, of, Subject, from } from 'rxjs';
import { startWith, tap, mergeMap, map, reduce } from 'rxjs/operators';
import { GatewayService } from '../../../../../api/gateway.service';
import {
  LotteryGameDrawCalendarList,
  LotteryGameDrawCalendar,
  CreateLotteryGameDrawCalendar,
  UpdateLotteryGameDrawCalendar,
  ApproveLotteryGameDrawCalendar,
  RevokeLotteryGameDrawCalendar,
  LotteryGameDrawCalendarUpdatedSubscription
} from '../../gql/draw-calendar.js';
import { Router, ActivatedRoute } from '@angular/router';

import { Location } from '@angular/common';

@Injectable({
  providedIn: 'root',
})
export class DrawCalendarService {

  lastOperation = null;

  drawCalendar = null;
  notifyDrawCalendarUpdated$ = new Subject();
  selectedDrawCalendarChanged$ = new BehaviorSubject(undefined);
  template;
  templateFormValid$ = new BehaviorSubject(false);
  dateList: any[];

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
        this.drawCalendar = game;
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
        this.drawCalendar = game;
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
        this.drawCalendar = null;
      })
    );
  }

  /* #region  PRIZE PROGRAM CQRS */
  lotteryGameDrawCalendarList$(filterInput) {
    return this.gateway.apollo.query<any>({
      query: LotteryGameDrawCalendarList,
      variables: {
        filterInput
      },
      fetchPolicy: 'network-only',
      errorPolicy: 'all'
    });
  }

  lotteryGameDrawCalendar$(id, filterInput) {
    return this.gateway.apollo.query<any>({
      query: LotteryGameDrawCalendar,
      variables: {
        id,
        filterInput
      },
      fetchPolicy: 'network-only',
      errorPolicy: 'all'
    });
  }

  createLotteryGameDrawCalendar$(input) {
    return this.gateway.apollo.mutate<any>({
      mutation: CreateLotteryGameDrawCalendar,
      variables: {
        input
      },
      errorPolicy: 'all'
    });
  }

  updateLotteryGameDrawCalendar$(id, input) {
    return this.gateway.apollo.mutate<any>({
      mutation: UpdateLotteryGameDrawCalendar,
      variables: {
        id,
        input
      },
      errorPolicy: 'all'
    });
  }

  approveLotteryGameDrawCalendar$(id, approved, approvedNotes) {
    return this.gateway.apollo.mutate<any>({
      mutation: ApproveLotteryGameDrawCalendar,
      variables: {
        id,
        approved,
        approvedNotes
      },
      errorPolicy: 'all'
    });
  }

  revokeLotteryGameDrawCalendar$(id, revoked, revokedNotes) {
    return this.gateway.apollo.mutate<any>({
      mutation: RevokeLotteryGameDrawCalendar,
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
    this.notifyDrawCalendarUpdated$.next(filterData);
  }

  /**
 * Event triggered when a lotteryGame is created, updated or deleted.
 */
  subscribeLotteryGameDrawCalendarUpdatedSubscription$(): Observable<any> {
    return this.gateway.apollo
      .subscribe({
        query: LotteryGameDrawCalendarUpdatedSubscription
      });
  }

}
