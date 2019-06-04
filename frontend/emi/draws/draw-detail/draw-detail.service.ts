import { Injectable } from '@angular/core';
import { Observable, BehaviorSubject, of, interval } from 'rxjs';
import { startWith,  tap, mergeMap, map, delay } from 'rxjs/operators';
import { GatewayService } from '../../../../api/gateway.service';
import {
  LotteryDraw,
  LotteryDrawConfirmResults,
  LotteryDrawApproveResults,
  LotteryDrawUpdated
} from '../gql/draws.js';

@Injectable()
export class DrawDetailService {
  constructor(private gateway: GatewayService) {

  }

  getServiceService$(id: string) {
    return this.gateway.apollo.query<any>({
      query: LotteryDraw,
      variables: {
        id: id
      },
      fetchPolicy: 'network-only',
      errorPolicy: 'all'
    });
  }

  /**
   * Approve or reject a draw results
   * @param drawId draw Id
   * @param approved true || false
   */
  approveResults$(drawId, approved, notes){
    return this.gateway.apollo.mutate<any>({
      mutation: LotteryDrawApproveResults,
      variables: { drawId, approved, notes },
      fetchPolicy: 'network-only',
      errorPolicy: 'all'
    });
  }

  confirmResults$(drawId, results){
    return this.gateway.apollo.mutate<any>({
      mutation: LotteryDrawConfirmResults,
      variables: { drawId, results },
      fetchPolicy: 'network-only',
      errorPolicy: 'all'
    });
  }

  listenDrawUpdates$(drawId){
    return this.gateway.apollo
    .subscribe({
      query: LotteryDrawUpdated,
      variables: { drawId }
    });
  }

}
