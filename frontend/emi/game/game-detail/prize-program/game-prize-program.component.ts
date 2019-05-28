////////// ANGULAR //////////
import {
  Component,
  OnInit,
  OnDestroy,
  ViewChild,
  ElementRef,
  Input,
  HostListener
} from '@angular/core';

import {
  FormBuilder,
  FormGroup,
  FormControl,
  Validators
} from '@angular/forms';

import { Router, ActivatedRoute } from '@angular/router';

import { Location } from '@angular/common';

////////// RXJS ///////////
import {
  map,
  mergeMap,
  switchMap,
  toArray,
  filter,
  tap,
  takeUntil,
  startWith,
  debounceTime,
  distinctUntilChanged,
  take,
  reduce
} from 'rxjs/operators';

import { Subject, fromEvent, of, forkJoin, Observable, concat, combineLatest, iif, from } from 'rxjs';

//////////// ANGULAR MATERIAL ///////////
import {
  MatSnackBar,
  MatDialog,
  MatTableDataSource
} from '@angular/material';

//////////// i18n ////////////
import {
  TranslateService
} from '@ngx-translate/core';
import { locale as english } from '../../i18n/en';
import { locale as spanish } from '../../i18n/es';
import { FuseTranslationLoaderService } from '../../../../../core/services/translation-loader.service';

//////////// Others ////////////
import { KeycloakService } from 'keycloak-angular';
import { GameDetailService } from '../game-detail.service';
import { DialogComponent } from '../../dialog/dialog.component';
import { ToolbarService } from '../../../../toolbar/toolbar.service';
import { R_OK } from 'constants';
import { PrizeProgramService } from './prize-program.service';

@Component({
  // tslint:disable-next-line:component-selector
  selector: 'game-prize-program',
  templateUrl: './game-prize-program.component.html',
  styleUrls: ['./game-prize-program.component.scss']
})
// tslint:disable-next-line:class-name
export class GamePrizeProgramComponent implements OnInit, OnDestroy {
  // Subject to unsubscribe
  private ngUnsubscribe = new Subject();

  @Input('game') game: any;

  gameGeneralInfoForm: any;
  gameStateForm: any;
  lotteryId;
  // Stream of filtered client by auto-complete text
  queriedLotteriesByAutocomplete$: Observable<any[]>;
  lotteryName = 'test';
  timeoutMessage = null;
  heightContent;
  selectedType;
  selectedPrizeProgram;
  displayedColumns = [
    'version'
  ];
  dataSource = new MatTableDataSource();
  prizeProgramList = [];

  constructor(
    private translationLoader: FuseTranslationLoaderService,
    private translate: TranslateService,
    public snackBar: MatSnackBar,
    private prizeProgramService: PrizeProgramService,
    private location: Location,
    private route: ActivatedRoute
  ) {
    this.translationLoader.loadTranslations(english, spanish);
    this.onResize();
  }


  ngOnInit() {

    this.refreshTable();
    this.subscribeGamePrizeProgramUpdated();
    this.subuscribeToSelectedPrizeProgramChange();

  }

  updateGameRoute(requiredParams: string[], newSegment: string) {
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
        this.location.go(url + '/' + newSegment);
    }, e => console.log(e));

  }

  refreshTable() {
    const filterInput = {
      gameId: this.game._id
    };
    this.prizeProgramService.lotteryGamePrizeProgramList$(filterInput).pipe(
      map(result => {
        return result && result.data && result.data.LotteryGamePrizeProgramList ? result.data.LotteryGamePrizeProgramList : [];
      }),
      filter(result => result && result.length > 0),
      tap(result => this.dataSource.data = result),
      mergeMap(result => {
        return this.route.params.pipe(
          map(params => params['itemId']),
          map(param => {
            return param ? result.filter(r => r._id === param)[0] : result[0];
          })
        );
      })
    ).subscribe(result => {
      if (!result) {
        result = (this.dataSource.data && this.dataSource.data.length > 0) ? this.dataSource.data[0] : undefined;
      }
      this.selectedPrizeProgram = result;
      this.prizeProgramService.selectedPrizeProgramChanged$.next(result);

    });
  }

  subuscribeToSelectedPrizeProgramChange() {
    this.prizeProgramService.selectedPrizeProgramChanged$.subscribe(prizeProgram => {
      this.selectedPrizeProgram = prizeProgram;
    });
  }

  clearSelected() {
    this.prizeProgramService.selectedPrizeProgramChanged$.next(undefined);
  }

  subscribeGamePrizeProgramUpdated() {
    this.prizeProgramService.subscribeLotteryGamePrizeProgramUpdatedSubscription$()
      .pipe(
        map(subscription => subscription.data.LotteryGamePrizeProgramUpdatedSubscription),
        takeUntil(this.ngUnsubscribe)
      )
      .subscribe((game: any) => {
        this.refreshTable();
      });
  }

  /**
   * Receives the selected game
   * @param game selected game
   */
  selectPrizeProgramRow(prizeProgram) {
    this.selectedPrizeProgram = prizeProgram;
    this.updateGameRoute(['id'], 'prize-program/' + prizeProgram._id);
    this.prizeProgramService.selectedPrizeProgramChanged$.next(prizeProgram);
  }


  @HostListener('window:resize', ['$event'])
  onResize(event?) {
    this.heightContent = ((window.innerHeight) - 310);
  }

  ngOnDestroy() {
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
  }

}
