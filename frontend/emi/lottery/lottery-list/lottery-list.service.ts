import { Injectable } from '@angular/core';
import { Observable, BehaviorSubject } from "rxjs";
import {
  startWith
} from "rxjs/operators";
import { GatewayService } from '../../../../api/gateway.service';
import {
  LotteryLotteries,
  LotteryLotteriesSize
} from '../gql/lottery';

@Injectable()
export class LotteryListService {

  private _filterSubject$ = new BehaviorSubject({
    filter: {}
  });

  private _paginatorSubject$ = new BehaviorSubject({
    pagination: {
      page: 0, count: 25, sort: -1
    },
  });

  constructor(private gateway: GatewayService) {

  }


  /**
   * Gets the lottery list
   * @param filter Data to filter the list
   * @param paginator Object that contains info about page number and amount of records to recover 
   * @returns {Observable} Observable with the lottery list
   */
  getlotteryList$(filterInput, paginatorInput){
    return this.gateway.apollo.query<any>({
      query: LotteryLotteries,
      variables: {
        filterInput: filterInput,
        paginationInput: paginatorInput
      },
      fetchPolicy: "network-only",
      errorPolicy: "all"
    });
  }

    /**
   * Gets the amount of lottery
   * @param filter Data to filter the list
   * @returns {Observable} Observable with the amount of lottery
   */
  getlotterySize$(filterInput){
    return this.gateway.apollo.query<any>({
      query: LotteryLotteriesSize,
      variables: {
        filterInput: filterInput
      },
      fetchPolicy: "network-only",
      errorPolicy: "all"
    });
  }



  /**
   * Emits an event when the filter is modified
   * @returns {Observable<any>}
   */
  get filter$(): Observable<any> {
    return this._filterSubject$.asObservable()
  }

  /**
   * Emits an event when the paginator is modified
   * @returns {Observable<any>}
   */
  get paginator$(): Observable<any> {
    return this._paginatorSubject$.asObservable()
  }

  updateFilterData(filterData){
    this._filterSubject$.next(filterData);
  }

  updatePaginatorData(paginatorData){
    this._paginatorSubject$.next(paginatorData);
  }

}
