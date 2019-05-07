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
import { msentitypascalDetailService } from './msentityname-detail.service';

@Component({
  // tslint:disable-next-line:component-selector
  selector: 'msentityname',
  templateUrl: './msentityname-detail.component.html',
  styleUrls: ['./msentityname-detail.component.scss']
})
// tslint:disable-next-line:class-name
export class msentitypascalDetailComponent implements OnInit, OnDestroy {
  // Subject to unsubscribe
  private ngUnsubscribe = new Subject();

  pageType: string;

  msentitycamel: any;

  constructor(
    private translationLoader: FuseTranslationLoaderService,
    private translate: TranslateService,
    private formBuilder: FormBuilder,
    public snackBar: MatSnackBar,
    private router: Router,
    private activatedRouter: ActivatedRoute,
    private msentitypascalDetailservice: msentitypascalDetailService,
    private route: ActivatedRoute
  ) {
      this.translationLoader.loadTranslations(english, spanish);
  }


  ngOnInit() {
    this.loadmsentitycamel();
    this.subscribemsentitypascalUpdated();
    this.stopWaitingOperation();
  }

  loadmsentitycamel(){
    this.route.params
    .pipe(
      map(params => params['id']),
      mergeMap(entityId => entityId !== 'new' ?
        this.msentitypascalDetailservice.getmsnamepascalmsentitypascal$(entityId).pipe(
          map(res => res.data.msnamepascalmsentitypascal)
        ) : of(null)
      ),
      takeUntil(this.ngUnsubscribe)
    )
    .subscribe((msentitycamel: any) => {
      this.msentitycamel = msentitycamel;
      this.pageType = (msentitycamel && msentitycamel._id) ? 'edit' : 'new'
    }, e => console.log(e));
  }
  
  subscribemsentitypascalUpdated(){
    this.msentitypascalDetailservice.subscribemsnamepascalmsentitypascalUpdatedSubscription$()
    .pipe(
      map(subscription => subscription.data.msnamepascalmsentitypascalUpdatedSubscription),
      takeUntil(this.ngUnsubscribe)
    )
    .subscribe((msentitycamel: any) => {
      this.msentitypascalDetailservice.notifymsentityUpdated(msentitycamel);
      this.checkIfEntityHasBeenUpdated(msentitycamel);
    })
  }

  checkIfEntityHasBeenUpdated(newmsentitycamel){
    if(this.msentitypascalDetailservice.lastOperation == 'CREATE'){

      //Fields that will be compared to check if the entity was created
      if(newmsentitycamel.generalInfo.name == this.msentitypascalDetailservice.msentitycamel.generalInfo.name 
        && newmsentitycamel.generalInfo.description == this.msentitypascalDetailservice.msentitycamel.generalInfo.description){
        //Show message entity created and redirect to the main page
        this.showSnackBar('msnameuppercase.ENTITY_CREATED');
        this.router.navigate(['msentityname/']);
      }

    }else if(this.msentitypascalDetailservice.lastOperation == 'UPDATE'){
      // Just comparing the ids is enough to recognise if it is the same entity
      if(newmsentitycamel._id == this.msentitycamel._id){
        //Show message entity updated and redirect to the main page
        this.showSnackBar('msnameuppercase.ENTITY_UPDATED');
        //this.router.navigate(['msentityname/']);
      }

    }else{
      if(this.msentitycamel != null && newmsentitycamel._id == this.msentitycamel._id){
        //Show message indicating that the entity has been updated
        this.showSnackBar('msnameuppercase.ENTITY_UPDATED');
      }
    }
  }

  stopWaitingOperation(){
    this.ngUnsubscribe.pipe(
      take(1),
      mergeMap(() => this.msentitypascalDetailservice.resetOperation$())
    ).subscribe(val => {
      //console.log('Reset operation');
    })
  }

  showSnackBar(message) {
    this.snackBar.open(this.translationLoader.getTranslate().instant(message),
      this.translationLoader.getTranslate().instant('msnameuppercase.CLOSE'), {
        duration: 2000
      });
  }

  ngOnDestroy() {
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
  }

}
