////////// ANGULAR //////////
import {
  Component,
  OnInit,
  OnDestroy,
  Input,
  ElementRef,
  ViewChild,
} from '@angular/core';

import {
  FormGroup,
  FormControl,
  Validators
} from '@angular/forms';


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
  take
} from 'rxjs/operators';

import { Subject, fromEvent, of, forkJoin, Observable, concat, combineLatest, iif, from } from 'rxjs';

//////////// ANGULAR MATERIAL ///////////
import {
  MatSnackBar,
  MatDialog,
  MatTableDataSource
} from '@angular/material';

//////////// i18n ////////////

import { locale as english } from '../../../../i18n/en';
import { locale as spanish } from '../../../../i18n/es';
import { FuseTranslationLoaderService } from '../../../../../../../core/services/translation-loader.service';

import { DrawCalendarService } from '../../draw-calendar.service';
import { DateListDialogComponent } from './date-list-dialog/date-list-dialog.component';

import { v4 as uuid } from 'uuid';
import { DialogComponent } from '../../../../dialog/dialog.component';
import { animate, state, style, transition, trigger } from '@angular/animations';
import { MAT_DATE_LOCALE, DateAdapter, MomentDateAdapter, MAT_DATE_FORMATS } from '@coachcare/datepicker';
import { MAT_MOMENT_DATE_FORMATS } from '../../my-date-format';
import * as moment from 'moment';
import { KeycloakService } from 'keycloak-angular';


@Component({
  // tslint:disable-next-line:component-selector
  selector: 'draw-calendar-date-list',
  templateUrl: './draw-calendar-date-list.component.html',
  styleUrls: ['./draw-calendar-date-list.component.scss'],
  animations: [
    trigger('detailExpand', [
      state('collapsed', style({ height: '0px', minHeight: '0', display: 'none' })),
      state('expanded', style({ height: '*' })),
      transition('expanded <=> collapsed', animate('225ms cubic-bezier(0.4, 0.0, 0.2, 1)')),
    ]),
  ],
  providers: [
    { provide: MAT_DATE_LOCALE, useValue: 'es' },
    {
      provide: DateAdapter,
      useClass: MomentDateAdapter,
      deps: [MAT_DATE_LOCALE]
    },
    { provide: MAT_DATE_FORMATS, useValue: MAT_MOMENT_DATE_FORMATS }
  ]
})
// tslint:disable-next-line:class-name
export class DrawCalendarDateListComponent implements OnInit, OnDestroy {
  // Subject to unsubscribe
  private ngUnsubscribe = new Subject();

  // Stream of filtered client by auto-complete text
  dateListChanged = new Subject();
  dataSource = new MatTableDataSource();
  expandedElement: any;
  displayedColumns = [
    'drawingDatetime',
    'drawState',
    'manage-buttons'
  ];
  dateListForm: FormGroup;
  totalPrize;
  paymentPrize;
  withSerie = true;
  selectedDateList;
  showManageButtons = false;
  userAllowedToUpdateInfo = false;
  @ViewChild('serieSlide') ref: ElementRef;
  constructor(
    private translationLoader: FuseTranslationLoaderService,
    public snackBar: MatSnackBar,
    private dialog: MatDialog,
    private drawCalendarService: DrawCalendarService,
    private keycloakService: KeycloakService
  ) {
    this.translationLoader.loadTranslations(english, spanish);
  }


  ngOnInit() {
    this.userAllowedToUpdateInfo = this.keycloakService.getUserRoles(true).some(role => role === 'LOTTERY-ADMIN' || role === 'PLATFORM-ADMIN');
    this.subuscribeToSelectedDrawCalendarChange();
    this.dateListForm = new FormGroup({
      openingDatetime: new FormControl('', [Validators.required]),
      closingDatetime: new FormControl('', [Validators.required]),
      drawingDatetime: new FormControl('', [Validators.required]),
      deactivationDatetime: new FormControl('', [Validators.required]),
    });
    !this.userAllowedToUpdateInfo ? this.dateListForm.disable() : this.dateListForm.enable();
  }

  createDateList() {
    this.dialog
      // Opens confirm dialog
      .open(DateListDialogComponent, {
        data: {
          dialogTitle: 'LOTTERY.CREATE_TITLE',
          dateListSelected: {}
        }
      })
      .afterClosed()
      .pipe(
        filter(result => result && result.okButton),
        map(({ openingDatetime, closingDatetime, drawingDatetime, deactivationDatetime }) => {
          const dateList = this.dataSource.data && this.dataSource.data.length > 0 ? this.dataSource.data : [];
          dateList.push({ id: uuid(), openingDatetime, closingDatetime, drawingDatetime, deactivationDatetime, drawState: 'OPEN' });
          return dateList;
        })
      ).subscribe(result => {
        this.drawCalendarService.dateList = result;
        result.sort((a, b) => {
          return (a as any).drawingDatetime > (b as any).drawingDatetime ? 1 : -1;
        });
        this.dataSource.data = result;
        console.log(result);
      });
  }

  editDateList(dateCalendar) {
    this.showConfirmationDialog$('LOTTERY.UPDATE_MESSAGE', 'LOTTERY.UPDATE_TITLE')
      .pipe(
        map(() => {
          let dateList = (this.dataSource.data && this.dataSource.data.length > 0 ? this.dataSource.data : [] as any);
          dateList = dateList.filter(element =>
            (element as any).id !== dateCalendar.id
          );
          dateList.push({
            id: dateList.id,
            openingDatetime: this.dateListForm.controls['openingDatetime'].value.valueOf(),
            closingDatetime: this.dateListForm.controls['closingDatetime'].value.valueOf(),
            drawingDatetime: this.dateListForm.controls['drawingDatetime'].value.valueOf(),
            deactivationDatetime: this.dateListForm.controls['deactivationDatetime'].value.valueOf()
          });
          dateList.sort((a, b) => {
            return (a as any).drawingDatetime > (b as any).drawingDatetime ? 1 : -1;
          });
          return dateList;
        })
      ).subscribe(result => {
        this.drawCalendarService.dateList = result;
        this.dataSource.data = result;
      });
  }

  removeDateList(dateList) {
    this.showConfirmationDialog$('LOTTERY.REMOVE_MESSAGE', 'LOTTERY.REMOVE_TITLE').pipe(
      map(() => {
        let currentList = this.dataSource.data;
        currentList = currentList.filter(seco =>
          (seco as any).id !== dateList.id
        );
        currentList.sort((a, b) => {
          return (a as any).drawingDatetime > (b as any).drawingDatetime ? 1 : -1;
        });
        return currentList;
      }),
      tap(result => {
        this.drawCalendarService.dateList = result;
        this.dataSource.data = result;
      })
    )
      .subscribe(result => {
      });
  }


  selectDateListRow(dateCalendar) {
    this.selectedDateList = dateCalendar;
  }

  numberOnly(event): boolean {
    const charCode = (event.which) ? event.which : event.keyCode;
    if (charCode > 31 && (charCode < 48 || charCode > 57)) {
      return false;
    }
    return true;
  }

  drawingDatetimeChanged(event) {
    // Build opening date time
    let selecteDrawTime = moment(this.dateListForm.controls['drawingDatetime'].value);
    const hourOfOpenDrawDate = moment(this.drawCalendarService.template.openDrawTime, 'HH:mm');
    selecteDrawTime.subtract(this.drawCalendarService.template.openDrawDaysBefore, 'days');
    selecteDrawTime.set({hour: hourOfOpenDrawDate.hours(), minute: hourOfOpenDrawDate.minutes(), second: 0, millisecond: 0});
    this.dateListForm.controls['openingDatetime'].setValue(selecteDrawTime);

    // Build closing date time
    selecteDrawTime = moment(this.dateListForm.controls['drawingDatetime'].value);
    selecteDrawTime.subtract(this.drawCalendarService.template.closeDrawMinutesBefore, 'minutes');
    this.dateListForm.controls['closingDatetime'].setValue(selecteDrawTime);

    // Build deactivation datetime
    selecteDrawTime = moment(this.dateListForm.controls['drawingDatetime'].value);
    const hourOfDeactivationDrawDate = moment(this.drawCalendarService.template.deactivateDrawtime, 'HH:mm');
    selecteDrawTime.add(this.drawCalendarService.template.deactivateDrawMonthsAfter, 'months');
    selecteDrawTime.set({hour: hourOfDeactivationDrawDate.hours(), minute: hourOfDeactivationDrawDate.minutes(), second: 0, millisecond: 0});
    this.dateListForm.controls['deactivationDatetime'].setValue(selecteDrawTime);
  }

  showDetailTable(element) {
    this.expandedElement = this.expandedElement === element ? null : element;
    this.dateListForm.controls['openingDatetime'].setValue(element.openingDatetime);
    this.dateListForm.controls['closingDatetime'].setValue(element.closingDatetime);
    this.dateListForm.controls['drawingDatetime'].setValue(element.drawingDatetime);
    this.dateListForm.controls['deactivationDatetime'].setValue(element.deactivationDatetime);
    this.withSerie = element.withSerie;
  }

  changeWithSerie() {
    this.withSerie = ((this.ref as any).checked);
  }

  subuscribeToSelectedDrawCalendarChange() {
    this.drawCalendarService.selectedDrawCalendarChanged$
      .subscribe(drawCalendar => {
        if (this.userAllowedToUpdateInfo && (!drawCalendar || (drawCalendar && (!drawCalendar.approved || drawCalendar.approved === 'NOT_APPROVED')))) {
          this.displayedColumns = [
            'drawingDatetime',
            'drawState',
            'manage-buttons'
          ];
          this.showManageButtons = true;
        } else {
          this.displayedColumns = [
            'drawingDatetime',
            'drawState',
          ];
          this.showManageButtons = false;
        }
        if (drawCalendar && drawCalendar.dateCalendar) {
          const newList = drawCalendar.dateCalendar.map(({ __typename, ...item }) => item);
          newList.sort((a, b) => {
            return (a as any).drawingDatetime > (b as any).drawingDatetime ? 1 : -1;
          });
          this.dataSource.data = newList;
          this.drawCalendarService.dateList = newList;
        } else {
          this.dataSource.data = [];
        }
      });
  }

  showConfirmationDialog$(dialogMessage, dialogTitle) {
    return this.dialog
      // Opens confirm dialog
      .open(DialogComponent, {
        data: {
          dialogMessage,
          dialogTitle
        }
      })
      .afterClosed()
      .pipe(
        filter(okButton => okButton),
      );
  }

  ngOnDestroy() {
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
  }

}
