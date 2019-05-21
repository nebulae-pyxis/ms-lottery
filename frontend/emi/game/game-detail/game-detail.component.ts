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
import { map, mergeMap, tap, takeUntil, take, reduce } from 'rxjs/operators';
import { Subject, of, from } from 'rxjs';

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
import { GameDetailService } from './game-detail.service';
import { Location } from '@angular/common';

@Component({
  // tslint:disable-next-line:component-selector
  selector: 'game',
  templateUrl: './game-detail.component.html',
  styleUrls: ['./game-detail.component.scss']
})
// tslint:disable-next-line:class-name
export class GameDetailComponent implements OnInit, OnDestroy {
  // Subject to unsubscribe
  private ngUnsubscribe = new Subject();

  pageType: string;
  selectedTab = 0;
  game: any;
  sectionId;

  constructor(
    private translationLoader: FuseTranslationLoaderService,
    private translate: TranslateService,
    private formBuilder: FormBuilder,
    public snackBar: MatSnackBar,
    private router: Router,
    private activatedRouter: ActivatedRoute,
    private GameDetailservice: GameDetailService,
    private route: ActivatedRoute,
    private location: Location
  ) {
    this.translationLoader.loadTranslations(english, spanish);
  }


  ngOnInit() {
    this.loadgame();
    this.subscribeGameUpdated();
    this.stopWaitingOperation();
  }

  loadgame() {
    this.route.params
      .pipe(
        tap(params => {
          const section = params['section'];
          if (section) {
            switch (section) {
              case 'sheet-config':
                this.selectedTab = 1;
                break;
              case 'general-info':
                this.selectedTab = 0;
                break;
            }
          }
        }),
        map(params => params['id']),
        mergeMap(entityId => entityId !== 'new' ?
          this.GameDetailservice.getLotteryGame$(entityId).pipe(
            map(res => res.data.LotteryGame)
          ) : of(null)
        ),
        takeUntil(this.ngUnsubscribe)
      )
      .subscribe((game: any) => {
        this.game = game;
        this.pageType = (game && game._id) ? 'edit' : 'new';
      }, e => console.log(e));
  }

  subscribeGameUpdated() {
    this.GameDetailservice.subscribeLotteryGameUpdatedSubscription$()
      .pipe(
        map(subscription => {
          return subscription.data.LotteryGameUpdatedSubscription;
        }),
        takeUntil(this.ngUnsubscribe)
      )
      .subscribe((game: any) => {
        this.GameDetailservice.notifymsentityUpdated(game);
        this.checkIfEntityHasBeenUpdated(game);
      });
  }

  onTabChange(event) {
    switch (event.index) {
      case 0:
        this.updateGameRoute(['id'], 'general-info');
        break;
      case 1:
        this.updateGameRoute(['id'], 'sheet-config/' + this.GameDetailservice.selectedConfigSheetChanged$.value._id);
        break;
    }
  }

  updateGameRoute(requiredParams: [string], newSegment: string) {
    this.route.params
      .pipe(
        mergeMap(params => {
          return from(requiredParams).pipe(
            reduce((acc, val) => {
              return acc + '/' + params[val];
            }, 'game')
          );
        })
      )
      .subscribe((url: any) => {
        this.location.replaceState(url + '/' + newSegment);
      }, e => console.log(e));

  }

  checkIfEntityHasBeenUpdated(newgame) {
    if (this.GameDetailservice.lastOperation === 'CREATE') {

      // Fields that will be compared to check if the entity was created
      if (newgame.generalInfo.name === this.GameDetailservice.game.generalInfo.name
        && newgame.generalInfo.description === this.GameDetailservice.game.generalInfo.description) {
        // Show message entity created and redirect to the main page
        this.showSnackBar('LOTTERY.ENTITY_CREATED');
        this.router.navigate(['game/']);
      }

    } else if (this.GameDetailservice.lastOperation === 'UPDATE') {
      // Just comparing the ids is enough to recognise if it is the same entity
      if (newgame._id === this.game._id) {
        // Show message entity updated and redirect to the main page
        this.showSnackBar('LOTTERY.ENTITY_UPDATED');
        // this.router.navigate(['game/']);
      }

    } else {
      if (this.game != null && newgame._id === this.game._id) {
        // Show message indicating that the entity has been updated
        this.showSnackBar('LOTTERY.ENTITY_UPDATED');
      }
    }
  }

  stopWaitingOperation() {
    this.ngUnsubscribe.pipe(
      take(1),
      mergeMap(() => this.GameDetailservice.resetOperation$())
    ).subscribe(val => {
      // console.log('Reset operation');
    });
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
