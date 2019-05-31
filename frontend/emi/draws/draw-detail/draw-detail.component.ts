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
import { DrawDetailService } from './draw-detail.service';

@Component({
  // tslint:disable-next-line:component-selector
  selector: 'pyxis-draw-detail',
  templateUrl: './draw-detail.component.html',
  styleUrls: ['./draw-detail.component.scss']
})
// tslint:disable-next-line:class-name
export class DrawDetailComponent implements OnInit, OnDestroy {
  // Subject to unsubscribe
  private ngUnsubscribe = new Subject();

  service: any;

  ///////////////////////////////////////////

  detailsOpened = false;
  resultsOpened = true;
  approvementOpened = false;


  selectedDraw = {
    generalInfo: {
      creationTimestamp: 15987485769,
      stateIcon: 'favorite',
      state: 'OPEN'
    },
// tslint:disable-next-line: max-line-length
    approvedNotes: `We've covered quite a bit of ground here, but it merely scratches the surface of how we can control the style of links.
    If you're ready to level up, then here are a few resources you can jump into from here:`
  };


  ///////////////////////////////////////////

  constructor(
    private translationLoader: FuseTranslationLoaderService,
    private translate: TranslateService,
    private formBuilder: FormBuilder,
    public snackBar: MatSnackBar,
    private router: Router,
    private activatedRouter: ActivatedRoute,
    private drawDetailService: DrawDetailService,
    private route: ActivatedRoute
  ) {
      this.translationLoader.loadTranslations(english, spanish);
  }


  ngOnInit() {
    this.loadservice();
    this.subscribeServiceUpdated();
  }

  loadservice(){
    this.route.params
    .pipe(
      map(params => params['id']),
      mergeMap(entityId => entityId !== 'new' ?
        this.drawDetailService.getServiceService$(entityId).pipe(
          map(res => res.data.ServiceService)
        ) : of(null)
      ),
      takeUntil(this.ngUnsubscribe)
    )
    .subscribe((service: any) => {
      this.service = service;
    }, e => console.log(e));
  }

  subscribeServiceUpdated(){
    this.drawDetailService.subscribeServiceServiceUpdatedSubscription$()
    .pipe(
      map(subscription => (subscription.data || {}).ServiceServiceUpdatedSubscription),
      takeUntil(this.ngUnsubscribe)
    )
    .subscribe((service: any) => {
      if (service != null && this.service != null && service._id === this.service._id){
        this.service = service;
      }
    });
  }

  showSnackBar(message) {
    this.snackBar.open(this.translationLoader.getTranslate().instant(message),
      this.translationLoader.getTranslate().instant('SERVICE.CLOSE'), {
        duration: 2000
      });
  }

  ngOnDestroy() {
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
  }

}
