import { Injectable } from '@angular/core';
import { Observable } from 'rxjs/Observable';
import * as Rx from 'rxjs';
import { GatewayService } from '../../../api/gateway.service';
import {} from './gql/lottery';

@Injectable()
export class LotteryService {


  constructor(private gateway: GatewayService) {

  }


}
