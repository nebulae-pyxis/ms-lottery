import { Injectable } from '@angular/core';
import { Observable, BehaviorSubject } from 'rxjs';
import { startWith } from 'rxjs/operators';
import { GatewayService } from '../../../../api/gateway.service';
import {
  ServiceServices,
  ServiceServicesSize,
  ServiceServiceUpdatedSubscription
} from '../gql/draws';
import * as moment from 'moment';

@Injectable()
export class DrawListService {
  private _filterSubject$ = new BehaviorSubject({
    // initTimestamp: moment()
    //   .subtract(1, 'day')
    //   .startOf('day'),
    // endTimestamp: moment().endOf('day'),
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

  constructor(private gateway: GatewayService) {}

  /**
   * Gets the service list
   * @param filter Data to filter the list
   * @param paginator Object that contains info about page number and amount of records to recover
   * @returns {Observable} Observable with the service list
   */
  getserviceList$(filterInput, paginatorInput) {
    return this.gateway.apollo.query<any>({
      query: ServiceServices,
      variables: {
        filterInput: filterInput,
        paginationInput: paginatorInput
      },
      fetchPolicy: 'network-only',
      errorPolicy: 'all'
    });
  }

  /**
   * Gets the amount of service
   * @param filter Data to filter the list
   * @returns {Observable} Observable with the amount of service
   */
  getserviceSize$(filterInput) {
    return this.gateway.apollo.query<any>({
      query: ServiceServicesSize,
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

  updateFilterData(filterData) {
    // console.log('filterData -->> ', filterData);
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
      query: ServiceServiceUpdatedSubscription
    });
  }
}
