import { Injectable } from '@angular/core';
import { Observable } from 'rxjs/Observable';
import * as Rx from 'rxjs';
import { GatewayService } from '../../../api/gateway.service';
import {} from './gql/game';

@Injectable()
export class GameService {


  constructor(private gateway: GatewayService) {

  }


}
