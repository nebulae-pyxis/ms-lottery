////////// ANGULAR //////////
import {
  Component,
  OnInit,
  OnDestroy,
  ViewChild,
} from '@angular/core';

import {
  FormBuilder,
  FormGroup,
  Validators,
} from '@angular/forms';

import { Router } from '@angular/router';

////////// RXJS ///////////
import {
  map,
  mergeMap,
  filter,
  tap,
  takeUntil,
  startWith,
  debounceTime,
  distinctUntilChanged,
  take
} from 'rxjs/operators';

import { Subject, of, forkJoin, combineLatest, Observable } from 'rxjs';

////////// ANGULAR MATERIAL //////////
import {
  MatPaginator,
  MatTableDataSource,
  MatSnackBar
} from '@angular/material';
import { fuseAnimations } from '../../../../core/animations';

//////////// i18n ////////////
import { TranslateService } from '@ngx-translate/core';
import { locale as english } from '../i18n/en';
import { locale as spanish } from '../i18n/es';
import { FuseTranslationLoaderService } from '../../../../core/services/translation-loader.service';

///////// DATEPICKER //////////
import {
  DateAdapter,
  MAT_DATE_LOCALE,
} from '@coachcare/datepicker';

import * as moment from 'moment';

//////////// Other Services ////////////
import { DrawListService } from './draw-list.service';
import { ToolbarService } from '../../../toolbar/toolbar.service';

@Component({
  // tslint:disable-next-line:component-selector
  selector: 'pyxis-lottery-draws',
  templateUrl: './draw-list.component.html',
  styleUrls: ['./draw-list.component.scss'],
  animations: fuseAnimations,
  providers: [{ provide: MAT_DATE_LOCALE, useValue: 'es' }]
})
export class DrawListComponent implements OnInit, OnDestroy {
  // Subject to unsubscribe
  private ngUnsubscribe = new Subject();

  stateList: string[] = [
    'REQUESTED',
    'ASSIGNED',
    'ARRIVED',
    'ON_BOARD',
    'DONE',
    'CANCELLED_CLIENT',
    'CANCELLED_DRIVER',
    'CANCELLED_OPERATOR',
    'CANCELLED_SYSTEM'
  ];

  minInitDate: any = null;
  maxInitDate: any = null;
  maxEndDate: any = null;
  minEndDate: any = null;

  //////// FORMS //////////
  filterForm: FormGroup;

  /////// TABLE /////////

  dataSource = new MatTableDataSource();

  @ViewChild(MatPaginator)
  paginator: MatPaginator;
  tableSize: number;
  tablePage = 0;
  tableCount = 25;

  // Columns to show in the table
  displayedColumns = ['lottery', 'openingDate', 'number', 'type', 'approved'];

  /////// OTHERS ///////

  selectedService: any = null;
  ////////// CURRENT ///////////////////
  threeStateOptions = ['null', 'true', 'false'];
  lotteryOptions = [];
  filteredLotteries$: Observable<any[]>;
  /////////////

  constructor(
    private formBuilder: FormBuilder,
    private translationLoader: FuseTranslationLoaderService,
    private translate: TranslateService,
    private snackBar: MatSnackBar,
    private router: Router,
    private adapter: DateAdapter<any>,
    private drawListService: DrawListService,
    private toolbarService: ToolbarService
  ) {
    this.translationLoader.loadTranslations(english, spanish);
  }

  ngOnInit() {
    this.onLangChange();
    this.buildFilterForm();
    this.loadLotteryOptions();
    this.updateFilterDataSubscription();
    this.updatePaginatorDataSubscription();
    this.loadLastFilters();
    this.refreshTableSubscription();

    this.filteredLotteries$ = this.filterForm.get('lottery').valueChanges
      .pipe(
        startWith(''),
        map(value => {
          const filterValue = value.toLowerCase();
          return this.lotteryOptions.filter(option => option.name.toLowerCase().includes(filterValue));

        })
      );
  }

  loadLotteryOptions() {
    this.drawListService.lotteryOptions$
      .pipe(
        mergeMap(opts =>
          opts === []
            ? this.drawListService.lotteryOptions$
                .pipe(tap(newOpts => this.drawListService.updateLotteryOptions(newOpts)))
            : of(opts)
        ),
        tap(lotteryOptions => this.lotteryOptions = lotteryOptions)
      )
      .subscribe();
  }

  onDateChange() {}

  /**
   * Changes the internationalization of the dateTimePicker component
   */
  onLangChange() {
    this.translate.onLangChange
      .pipe(
        startWith({ lang: this.translate.currentLang }),
        takeUntil(this.ngUnsubscribe)
      )
      .subscribe(event => {
        if (event) {
          this.adapter.setLocale(event.lang);
        }
      });
  }

  /**
   * Emits the filter form data when it changes
   */
  listenFilterFormChanges$() {
    return this.filterForm.valueChanges.pipe(
      debounceTime(500),
      distinctUntilChanged()
    );
  }

  /**
   * Emits the paginator data when it changes
   */
  listenPaginatorChanges$() {
    return this.paginator.page;
  }

  /**
   * Builds filter form
   */
  buildFilterForm() {
    const initTimeStampValue = moment()
      .subtract(1, 'day')
      .startOf('day');
    this.filterForm = this.formBuilder.group({
      timestamp: [initTimeStampValue, [Validators.required]],
      lottery: [null],
      drawNumber: [null],
      type: [null],
      active: ['false'],
      approved: ['null'],
      withResults: ['null']
    });

    this.filterForm.disable({
      onlySelf: true,
      emitEvent: false
    });


  }

  updateFilterDataSubscription() {
    this.listenFilterFormChanges$()
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe(filterData => {
        // console.log('filterData => ', filterData.initTimestamp.format(), filterData.endTimestamp.format());
        this.drawListService.updateFilterData(filterData);
      });
  }

  updatePaginatorDataSubscription() {
    this.listenPaginatorChanges$()
      .pipe(
        takeUntil(this.ngUnsubscribe),
        map(pagination => ({
          pagination: {
            page: pagination.pageIndex,
            count: pagination.pageSize,
            sort: -1
          }
        })),
        tap(paginator => this.drawListService.updatePaginatorData(paginator))
      )
      .subscribe();
  }

  /**
   * First time that the page is loading is needed to check if there were filters applied previously to load this info into the forms
   */
  loadLastFilters() {
    combineLatest(
      this.drawListService.filter$,
      this.drawListService.paginator$,
      this.drawListService.lotteryOptions$
    )
      .pipe(take(1))
      .subscribe(([filterValue, paginator]) => {
        if (filterValue) {
          this.filterForm.patchValue({
            timestamp: filterValue.timestamp,
            lottery: filterValue.lottery,
            drawNumber: filterValue.drawNumber,
            type: filterValue.type,
            approved: filterValue.approved || 'null',
            withResults: filterValue.withResults || 'null'
          });
        }

        if (paginator) {
          this.tablePage = paginator.pagination.page;
          this.tableCount = paginator.pagination.count;
        }

        this.filterForm.enable({ emitEvent: true });
      });
  }

  /**
   * If a change is detect in the filter or the paginator then the table will be refreshed according to the values emmited
   */
  refreshTableSubscription() {
    combineLatest(
      this.drawListService.filter$,
      this.drawListService.paginator$,
      this.toolbarService.onSelectedBusiness$
    )
      .pipe(
        debounceTime(500),
        filter(
          ([filterValue, paginator, selectedBusiness]) =>
            filterValue != null && paginator != null
        ),
        map(([filterValue, paginator, selectedBusiness]) => {
          const filterInput = {
            businessId: selectedBusiness ? selectedBusiness.id : null,
            timestamp: filterValue.timestamp ? filterValue.timestamp.valueOf() : null,
            lotteryId: filterValue.lottery,
            drawType: filterValue.type,
            drawNumber: filterValue.drawNumber,
            active: filterValue.showActiveDraws,
            approved: filterValue.approved || 'null',
            withResults: filterValue.withResults || 'null'
          };

          const paginationInput = {
            page: paginator.pagination.page,
            count: paginator.pagination.count,
            sort: paginator.pagination.sort
          };

          return [filterInput, paginationInput];
        }),
        mergeMap(([filterInput, paginationInput]) =>
          forkJoin(
            this.getDrawList$(filterInput, paginationInput),
            this.getDrawSize$(filterInput)
          )
        ),
        takeUntil(this.ngUnsubscribe)
      )
      .subscribe(([list, size]) => {
        this.dataSource.data = list;
        this.tableSize = size;
      });
  }

  /**
   * Gets the service list
   * @param filterInput
   * @param paginationInput
   */
  getDrawList$(filterInput, paginationInput) {
    return this.drawListService.getDrawList$(filterInput, paginationInput).pipe(
      mergeMap(resp => this.graphQlAlarmsErrorHandler$(resp)),
      map(resp => resp.data.ServiceServices)
    );
  }

  /**
   * Gets the service size
   * @param filterInput
   */
  getDrawSize$(filterInput) {
    return this.drawListService.getDrawSize$(filterInput).pipe(
      mergeMap(resp => this.graphQlAlarmsErrorHandler$(resp)),
      map(resp =>
        resp.data && resp.data.ServiceServicesSize
          ? resp.data.ServiceServicesSize
          : 0
      )
    );
  }

  /**
   * Receives the selected service
   * @param service selected service
   */
  selectserviceRow(service) {
    this.selectedService = service;
  }

  resetFilter() {
    console.log(this.filterForm.getRawValue());

    this.filterForm.reset();
    this.paginator.pageIndex = 0;
    this.tablePage = 0;
    this.tableCount = 25;

    // const startOfMonth = moment().startOf('month');
    const startYesterday = moment()
      .subtract(1, 'day')
      .startOf('day');
    // const endOfMonth = moment().endOf('day');
    this.filterForm.patchValue({
      // initTimestamp: startYesterday,
      // endTimestamp: endOfMonth
      timestamp: startYesterday,
      Active: true,
      approved: 'null',
      withResults: 'null'
    });



    this.paginator._changePageSize(25);
  }

  refreshData() {
    const drawNumber = this.filterForm.get('drawNumber').value;
    this.filterForm.get('drawNumber').setValue(drawNumber);
  }

  /**
   * Navigates to the detail page
   */
  goToDetail() {
    this.toolbarService.onSelectedBusiness$
      .pipe(take(1))
      .subscribe(selectedBusiness => {
        if (selectedBusiness == null || selectedBusiness.id == null) {
          this.showSnackBar('SERVICE.SELECT_BUSINESS');
        } else {
          this.router.navigate(['service/new']);
        }
      });
  }

  /**
   * Updates to next ThreeState state
   * @param controlName three state control name
   */
  updateThreeStateValue(controlName: string) {
    let currentStateAplied = this.filterForm.get(controlName).value;
    currentStateAplied = this.threeStateOptions[
      (this.threeStateOptions.indexOf(currentStateAplied) + 1) %
        this.threeStateOptions.length
    ];
    this.filterForm.get(controlName).setValue(currentStateAplied);
  }

  showSnackBar(message) {
    this.snackBar.open(
      this.translationLoader.getTranslate().instant(message),
      this.translationLoader.getTranslate().instant('DRAWS.CLOSE'),
      {
        duration: 4000
      }
    );
  }

  graphQlAlarmsErrorHandler$(response) {
    return of(JSON.parse(JSON.stringify(response))).pipe(
      tap((resp: any) => {
        if (response && Array.isArray(response.errors)) {
          response.errors.forEach(error => {
            this.showMessageSnackbar(
              'ERRORS.' + ((error.extensions || {}).code || 1)
            );
          });
        }
        return resp;
      })
    );
  }

  /**
   * Shows a message snackbar on the bottom of the page
   * @param messageKey Key of the message to i18n
   * @param detailMessageKey Key of the detail message to i18n
   */
  showMessageSnackbar(messageKey, detailMessageKey?) {
    const translationData = [];
    if (messageKey) {
      translationData.push(messageKey);
    }

    if (detailMessageKey) {
      translationData.push(detailMessageKey);
    }

    this.translate.get(translationData).subscribe(data => {
      this.snackBar.open(
        messageKey ? data[messageKey] : '',
        detailMessageKey ? data[detailMessageKey] : '',
        {
          duration: 2000
        }
      );
    });
  }

  ngOnDestroy() {
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
  }
}
