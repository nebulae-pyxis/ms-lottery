import { Injectable } from '@angular/core';
import { Observable, BehaviorSubject, of, Subject } from 'rxjs';
import { startWith,  tap, mergeMap } from 'rxjs/operators';
import { GatewayService } from '../../../../api/gateway.service';
import {
  LotteryCreateLottery,
  LotteryUpdateLotteryGeneralInfo,
  LotteryUpdateLotteryState,
  LotteryLottery,
  LotteryLotteryUpdatedSubscription
} from '../gql/lottery.js';

@Injectable()
export class LotteryDetailService {

  lastOperation = null;

  lottery = null;

  notifyLotteryLotteryUpdated$ = new Subject();

  constructor(private gateway: GatewayService) {

  }

  /**
   * Registers an operation, this is useful to indicate that we are waiting for the response of the CREATE operation
   */
  createOperation$(lottery: any) {
    return of('CREATE').pipe(
      tap(operation => {
        this.lastOperation = operation;
        this.lottery = lottery;
      })
    );
  }

  /**
   * Registers an operation, this is useful to indicate that we are waiting for the response of the UPDATE operation
   */
  updateOperation$(lottery: any) {
    return of('UPDATE').pipe(
      tap(operation => {
        this.lastOperation = operation;
        this.lottery = lottery;
      })
    );
  }

  /**
   * Unregisters an operation, this is useful to indicate that we are not longer waiting for the response of the last operation
   */
  resetOperation$(){
    return of('').pipe(
      tap(() => {
        this.lastOperation = null;
        this.lottery = null;
      })
    );
  }

  createLotteryLottery$(lottery: any) {
    return this.createOperation$(lottery)
    .pipe(
      mergeMap(() => {
        return this.gateway.apollo
        .mutate<any>({
          mutation: LotteryCreateLottery,
          variables: {
            input: lottery
          },
          errorPolicy: 'all'
        });
      })
    )
  }

  updateLotteryLotteryGeneralInfo$(id: String, lotteryGeneralInfo: any) {
    return this.updateOperation$(lotteryGeneralInfo)
    .pipe(
      mergeMap(() => {
        return this.gateway.apollo
        .mutate<any>({
          mutation: LotteryUpdateLotteryGeneralInfo,
          variables: {
            id: id,
            input: lotteryGeneralInfo
          },
          errorPolicy: 'all'
        });
      })
    )
  }

  updateLotteryLotteryState$(id: String, newState: boolean) {
    return this.gateway.apollo
      .mutate<any>({
        mutation: LotteryUpdateLotteryState,
        variables: {
          id: id,
          newState: newState
        },
        errorPolicy: 'all'
      });
  }

  getLotteryLottery$(entityId: string) {
    return this.gateway.apollo.query<any>({
      query: LotteryLottery,
      variables: {
        id: entityId
      },
      fetchPolicy: "network-only",
      errorPolicy: "all"
    });
  }

  notifymsentityUpdated(filterData){
    this.notifyLotteryLotteryUpdated$.next(filterData);
  }

/**
 * Event triggered when a business is created, updated or deleted.
 */
subscribeLotteryLotteryUpdatedSubscription$(): Observable<any> {
  return this.gateway.apollo
  .subscribe({
    query: LotteryLotteryUpdatedSubscription
  });
}

}
