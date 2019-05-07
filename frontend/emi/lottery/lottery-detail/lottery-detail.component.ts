////////// ANGULAR //////////
import {
  Component,
  OnInit,
  OnDestroy
} from '@angular/core';

import {
  FormBuilder,
  FormGroup,
  FormControl,
  Validators
} from '@angular/forms';

import { Router, ActivatedRoute } from '@angular/router';

////////// RXJS ///////////
import { map, mergeMap, tap, takeUntil, take } from 'rxjs/operators';
import { Subject, of} from 'rxjs';

//////////// ANGULAR MATERIAL ///////////
import {
  MatPaginator,
  MatSort,
  MatTableDataSource,
  MatSnackBar
} from '@angular/material';

//////////// i18n ////////////
import {
  TranslateService
} from '@ngx-translate/core';
import { locale as english } from '../i18n/en';
import { locale as spanish } from '../i18n/es';
import { FuseTranslationLoaderService } from '../../../../core/services/translation-loader.service';

//////////// Other Services ////////////
import { KeycloakService } from 'keycloak-angular';
import { LotteryDetailService } from './lottery-detail.service';

@Component({
  // tslint:disable-next-line:component-selector
  selector: 'lottery',
  templateUrl: './lottery-detail.component.html',
  styleUrls: ['./lottery-detail.component.scss']
})
// tslint:disable-next-line:class-name
export class LotteryDetailComponent implements OnInit, OnDestroy {
  // Subject to unsubscribe
  private ngUnsubscribe = new Subject();

  pageType: string;

  lottery: any;

  constructor(
    private translationLoader: FuseTranslationLoaderService,
    private translate: TranslateService,
    private formBuilder: FormBuilder,
    public snackBar: MatSnackBar,
    private router: Router,
    private activatedRouter: ActivatedRoute,
    private LotteryDetailservice: LotteryDetailService,
    private route: ActivatedRoute
  ) {
      this.translationLoader.loadTranslations(english, spanish);
  }


  ngOnInit() {
    this.loadlottery();
    this.subscribeLotteryUpdated();
    this.stopWaitingOperation();
  }

  loadlottery(){
    this.route.params
    .pipe(
      map(params => params['id']),
      mergeMap(entityId => entityId !== 'new' ?
        this.LotteryDetailservice.getLotteryLottery$(entityId).pipe(
          map(res => res.data.LotteryLottery)
        ) : of(null)
      ),
      takeUntil(this.ngUnsubscribe)
    )
    .subscribe((lottery: any) => {
      this.lottery = lottery;
      this.pageType = (lottery && lottery._id) ? 'edit' : 'new'
    }, e => console.log(e));
  }
  
  subscribeLotteryUpdated(){
    this.LotteryDetailservice.subscribeLotteryLotteryUpdatedSubscription$()
    .pipe(
      map(subscription => subscription.data.LotteryLotteryUpdatedSubscription),
      takeUntil(this.ngUnsubscribe)
    )
    .subscribe((lottery: any) => {
      this.LotteryDetailservice.notifymsentityUpdated(lottery);
      this.checkIfEntityHasBeenUpdated(lottery);
    })
  }

  checkIfEntityHasBeenUpdated(newlottery){
    if(this.LotteryDetailservice.lastOperation == 'CREATE'){

      //Fields that will be compared to check if the entity was created
      if(newlottery.generalInfo.name == this.LotteryDetailservice.lottery.generalInfo.name 
        && newlottery.generalInfo.description == this.LotteryDetailservice.lottery.generalInfo.description){
        //Show message entity created and redirect to the main page
        this.showSnackBar('LOTTERY.ENTITY_CREATED');
        this.router.navigate(['lottery/']);
      }

    }else if(this.LotteryDetailservice.lastOperation == 'UPDATE'){
      // Just comparing the ids is enough to recognise if it is the same entity
      if(newlottery._id == this.lottery._id){
        //Show message entity updated and redirect to the main page
        this.showSnackBar('LOTTERY.ENTITY_UPDATED');
        //this.router.navigate(['lottery/']);
      }

    }else{
      if(this.lottery != null && newlottery._id == this.lottery._id){
        //Show message indicating that the entity has been updated
        this.showSnackBar('LOTTERY.ENTITY_UPDATED');
      }
    }
  }

  stopWaitingOperation(){
    this.ngUnsubscribe.pipe(
      take(1),
      mergeMap(() => this.LotteryDetailservice.resetOperation$())
    ).subscribe(val => {
      //console.log('Reset operation');
    })
  }

  showSnackBar(message) {
    this.snackBar.open(this.translationLoader.getTranslate().instant(message),
      this.translationLoader.getTranslate().instant('LOTTERY.CLOSE'), {
        duration: 2000
      });
  }

  ngOnDestroy() {
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
  }

}
