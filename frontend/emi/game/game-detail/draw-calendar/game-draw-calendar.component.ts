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
import { DrawCalendarService } from './draw-calendar.service';
import { DialogComponent } from '../../dialog/dialog.component';
import { ToolbarService } from '../../../../toolbar/toolbar.service';
import { R_OK } from 'constants';

@Component({
  // tslint:disable-next-line:component-selector
  selector: 'game-draw-calendar',
  templateUrl: './game-draw-calendar.component.html',
  styleUrls: ['./game-draw-calendar.component.scss']
})
// tslint:disable-next-line:class-name
export class GameDrawCalendarComponent implements OnInit, OnDestroy {
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
  selectedDrawCalendar;
  displayedColumns = [
    'version'
  ];
  dataSource = new MatTableDataSource();
  drawCalendarList = [];

  constructor(
    private translationLoader: FuseTranslationLoaderService,
    private translate: TranslateService,
    public snackBar: MatSnackBar,
    private drawCalendarService: DrawCalendarService,
    private location: Location,
    private route: ActivatedRoute
  ) {
    this.translationLoader.loadTranslations(english, spanish);
    this.onResize();
  }


  ngOnInit() {

    this.refreshTable();
    this.subscribeGameDrawCalendarUpdated();
    this.subuscribeToSelectedDrawCalendarChange();

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
    this.drawCalendarService.lotteryGameDrawCalendarList$(filterInput).pipe(
      map(result => {
        return result && result.data && result.data.LotteryGameDrawCalendarList ? result.data.LotteryGameDrawCalendarList : [];
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
      this.selectedDrawCalendar = result;
      this.drawCalendarService.selectedDrawCalendarChanged$.next(result);

    });
  }

  subuscribeToSelectedDrawCalendarChange() {
    this.drawCalendarService.selectedDrawCalendarChanged$.subscribe(drawCalendar => {
      this.selectedDrawCalendar = drawCalendar;
    });
  }

  clearSelected() {
    this.drawCalendarService.selectedDrawCalendarChanged$.next(undefined);
  }

  subscribeGameDrawCalendarUpdated() {
    this.drawCalendarService.subscribeLotteryGameDrawCalendarUpdatedSubscription$()
      .pipe(
        map(subscription => subscription.data.LotteryGameDrawCalendarUpdatedSubscription),
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
  selectDrawCalendarRow(drawCalendar) {
    this.selectedDrawCalendar = drawCalendar;
    this.updateGameRoute(['id'], 'draw-calendar/' + drawCalendar._id);
    this.drawCalendarService.selectedDrawCalendarChanged$.next(drawCalendar);
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
