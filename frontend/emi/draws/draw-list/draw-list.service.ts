import { Injectable } from '@angular/core';
import { Observable, BehaviorSubject } from 'rxjs';
import { GatewayService } from '../../../../api/gateway.service';
import {
  LotteryLotteries,
  LotteryDraws,
  LotteryDrawsSize,
  LotteryDrawUpdated
} from '../gql/draws';
import * as moment from 'moment';

@Injectable()
export class DrawListService {
  private _filterSubject$ = new BehaviorSubject({
    timestamp: moment()
      .subtract(1, 'day')
      .startOf('day'),
  });

  private _paginatorSubject$ = new BehaviorSubject({
    pagination: {
      page: 0,
      count: 25,
      sort: -1
    }
  });

  private _lotteryOptions$ = new BehaviorSubject([]);

  constructor(private gateway: GatewayService) {}

  /**
   * Gets the service list
   * @param filter Data to filter the list
   * @param paginator Object that contains info about page number and amount of records to recover
   * @returns {Observable} Observable with the service list
   */
  getDrawList$(filterInput, paginatorInput) {
    return this.gateway.apollo.query<any>({
      query: LotteryDraws,
      variables: {
        filterInput: filterInput,
        paginationInput: paginatorInput
      },
      fetchPolicy: 'network-only',
      errorPolicy: 'all'
    });
  }

  getLotteryList$(){
    return this.gateway.apollo.query<any>({
      query: LotteryLotteries,
      fetchPolicy: 'network-only',
      errorPolicy: 'all'
    });
  }

  /**
   * Gets the amount of service
   * @param filter Data to filter the list
   * @returns {Observable} Observable with the amount of service
   */
  getDrawSize$(filterInput) {
    return this.gateway.apollo.query<any>({
      query: LotteryDrawsSize,
      variables: {
        filterInput: filterInput
      },
      fetchPolicy: 'network-only',
      errorPolicy: 'all'
    });
  }

  /**
   * Emits an event when the filter is modified
   * @returns {Observable<any>}
   */
  get filter$(): Observable<any> {
    return this._filterSubject$.asObservable();
  }

  /**
   * Emits an event when the paginator is modified
   * @returns {Observable<any>}
   */
  get paginator$(): Observable<any> {
    return this._paginatorSubject$.asObservable();
  }

   /**
   * Emits an event when the paginator is modified
   * @returns {Observable<any>}
   */
  get lotteryOptions$(): Observable<any> {
    return this._lotteryOptions$.asObservable();
  }

  updateLotteryOptions(lotteryOptions) {
    this._lotteryOptions$.next(lotteryOptions);
  }


  updateFilterData(filterData) {
    this._filterSubject$.next(filterData);
  }

  updatePaginatorData(paginatorData) {
    this._paginatorSubject$.next(paginatorData);
  }

  /**
   * Event triggered when a business is created, updated or deleted.
   */
  subscribeServiceServiceUpdatedSubscription$(): Observable<any> {
    return this.gateway.apollo.subscribe({
      query: LotteryDrawUpdated
    });
  }
}
