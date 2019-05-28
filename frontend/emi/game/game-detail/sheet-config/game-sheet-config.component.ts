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

@Component({
  // tslint:disable-next-line:component-selector
  selector: 'game-sheet-config',
  templateUrl: './game-sheet-config.component.html',
  styleUrls: ['./game-sheet-config.component.scss']
})
// tslint:disable-next-line:class-name
export class GameSheetConfigComponent implements OnInit, OnDestroy {
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
  selectedSheetConfig;
  displayedColumns = [
    'version'
  ];
  dataSource = new MatTableDataSource();
  configSheetList = [];

  constructor(
    private translationLoader: FuseTranslationLoaderService,
    private translate: TranslateService,
    public snackBar: MatSnackBar,
    private gameDetailService: GameDetailService,
    private location: Location,
    private route: ActivatedRoute
  ) {
    this.translationLoader.loadTranslations(english, spanish);
    this.onResize();
  }


  ngOnInit() {

    this.refreshTable();
    this.subscribeGameSheetConfigUpdated();
    this.subuscribeToSelectedSheetConfigChange();

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
    this.gameDetailService.lotteryGameSheetConfigList$(filterInput).pipe(
      map(result => {
        return result && result.data && result.data.LotteryGameSheetConfigList ? result.data.LotteryGameSheetConfigList : [];
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
      this.selectedSheetConfig = result;
      this.gameDetailService.selectedConfigSheetChanged$.next(result);

    });
  }

  subuscribeToSelectedSheetConfigChange() {
    this.gameDetailService.selectedConfigSheetChanged$.subscribe(configSheet => {
      this.selectedSheetConfig = configSheet;
    });
  }

  clearSelected() {
    this.gameDetailService.selectedConfigSheetChanged$.next(undefined);
  }

  subscribeGameSheetConfigUpdated() {
    this.gameDetailService.subscribeLotteryGameSheetConfigUpdatedSubscription$()
      .pipe(
        map(subscription => subscription.data.LotteryGameSheetConfigUpdatedSubscription),
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
  selectSheetConfigRow(sheetConfig) {
    this.selectedSheetConfig = sheetConfig;
    this.updateGameRoute(['id'], 'sheet-config/' + sheetConfig._id);
    this.gameDetailService.selectedConfigSheetChanged$.next(sheetConfig);
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
