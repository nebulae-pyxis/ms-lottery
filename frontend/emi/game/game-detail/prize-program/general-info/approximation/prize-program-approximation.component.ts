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

import { PrizeProgramService } from '../../prize-program.service';
import { ApproximationDialogComponent } from './approximation-dialog/approximation-dialog.component';

import { v4 as uuid } from 'uuid';
import { DialogComponent } from '../../../../dialog/dialog.component';
import { animate, state, style, transition, trigger } from '@angular/animations';
import { SecoDetailDialogComponent } from './seco-detail-dialog/seco-detail-dialog.component';
import { KeycloakService } from 'keycloak-angular';


@Component({
  // tslint:disable-next-line:component-selector
  selector: 'prize-program-approximation',
  templateUrl: './prize-program-approximation.component.html',
  styleUrls: ['./prize-program-approximation.component.scss'],
  animations: [
    trigger('detailExpand', [
      state('collapsed', style({ height: '0px', minHeight: '0', display: 'none' })),
      state('expanded', style({ height: '*' })),
      transition('expanded <=> collapsed', animate('225ms cubic-bezier(0.4, 0.0, 0.2, 1)')),
    ]),
  ],
})
// tslint:disable-next-line:class-name
export class PrizeProgramApproximationComponent implements OnInit, OnDestroy {
  // Subject to unsubscribe
  private ngUnsubscribe = new Subject();

  // Stream of filtered client by auto-complete text
  approximationChanged = new Subject();
  dataSource = new MatTableDataSource();
  expandedElement: any;
  displayedColumns = [
    'name',
    'approximationTo',
    'total',
    'manage-buttons'

  ];
  approximationForm: FormGroup;
  totalPrize;
  paymentPrize;
  selectedApproximation;
  showManageButtons = false;
  selectedNumberMaskType = 'SAME';
  selectedSerialMaskType = 'ANY';
  selectedApproximationTo = 'GRAND_PRIZE';
  userAllowedToUpdateInfo = false;
  approximationsTolds;
  @ViewChild('serieSlide') ref: ElementRef;
  constructor(
    private translationLoader: FuseTranslationLoaderService,
    public snackBar: MatSnackBar,
    private dialog: MatDialog,
    private prizeProgramService: PrizeProgramService,
    private keycloakService: KeycloakService
  ) {
    this.translationLoader.loadTranslations(english, spanish);
  }


  ngOnInit() {
    this.userAllowedToUpdateInfo = this.keycloakService.getUserRoles(true).some(role => role === 'LOTTERY-ADMIN' || role === 'PLATFORM-ADMIN');
    this.subuscribeToSelectedPrizeProgramChange();
    this.approximationForm = new FormGroup({
      order: new FormControl('', [Validators.required]),
      name: new FormControl('', [Validators.required]),
      numberMaskRegex: new FormControl('', []),
      serieMaskType: new FormControl('', []),
      numberMaskType: new FormControl('', []),
      approximationTo: new FormControl('', []),
      totalPrize: new FormControl('', [Validators.required]),
      paymentPrize: new FormControl('', [Validators.required]),
    });
    !this.userAllowedToUpdateInfo ? this.approximationForm.disable() : this.approximationForm.enable();
  }

  createApproximation() {
    this.dialog
      // Opens confirm dialog
      .open(ApproximationDialogComponent, {
        data: {
          dialogTitle: 'LOTTERY.CREATE_TITLE',
        }
      })
      .afterClosed()
      .pipe(
        filter(result => result && result.okButton),
        map(({name, numberMaskRegex, total, payment, approximationTo, numberMaskType, seriesMaskType}) => {
          const approximations = this.dataSource.data && this.dataSource.data.length > 0 ? this.dataSource.data : [];
          approximations.push({order: this.prizeProgramService.approximations.length + 1, name, numberMaskRegex, total, payment, approximationTo, numberMaskType, seriesMaskType});
          return approximations;
        })
      ).subscribe(result => {
        result.sort((a, b) => {
          return (a as any).order > (b as any).order ? 1 : -1;
        });
        this.prizeProgramService.approximations = result;
        this.dataSource.data = result;
        console.log(result);
      });
  }

  editApproximation(approximation) {
    this.showConfirmationDialog$('LOTTERY.UPDATE_MESSAGE', 'LOTTERY.UPDATE_TITLE')
      .pipe(
        map(() => {
          return {
            order: parseInt(this.approximationForm.controls['order'].value),
            name: this.approximationForm.controls['name'].value,
            numberMaskRegex: parseInt(this.approximationForm.controls['numberMaskRegex'].value),
            total: parseInt(this.approximationForm.controls['totalPrize'].value),
            payment: parseInt(this.approximationForm.controls['paymentPrize'].value),
            approximationTo: this.selectedApproximationTo,
            numberMaskType: this.selectedNumberMaskType,
            seriesMaskType: this.selectedSerialMaskType,
            approximationsTolds: this.approximationsTolds
          };
        }),
        map(element => {
          let approximations = this.dataSource.data && this.dataSource.data.length > 0 ? this.dataSource.data : [];
          approximations = approximations.filter(item =>
            (item as any).order !== approximation.order && (item as any).name !== approximation.name
          );
          const subArray1 = approximations.slice(0, element.order - 1);
          subArray1.push(element);
          const subArray2 = approximations.slice(element.order - 1, approximations.length);
          return [...subArray1, ...subArray2];
        }),
        mergeMap(unsortedList => {
          let order = 1;
          return from(unsortedList).pipe(
            map((unsortedElement: any) => {
              unsortedElement.order = order;
              order++;
              return unsortedElement;
            }),
            toArray()
          );
        })
      ).subscribe((result: any) => {
        this.prizeProgramService.approximations = result;
        this.dataSource.data = result;
      });
  }

  removeApproximation(approximation) {
    this.showConfirmationDialog$('LOTTERY.REMOVE_MESSAGE', 'LOTTERY.REMOVE_TITLE')
      .subscribe(() => {
        let currentList = this.dataSource.data;
        currentList = currentList.filter(seco =>
          (seco as any).id !== approximation.id
        );
        currentList.sort((a, b) => {
          return (a as any).order > (b as any).order ? 1 : -1;
        });
        this.prizeProgramService.approximations = currentList;
        this.dataSource.data = currentList;
      });
  }


  selectApproximationRow(prizeProgram) {
    this.selectedApproximation = prizeProgram;
  }

  numberOnly(event): boolean {
    const charCode = (event.which) ? event.which : event.keyCode;
    if (charCode > 31 && (charCode < 48 || charCode > 57)) {
      return false;
    }
    return true;
  }

  showSecoDetailDialog(approximation) {
    this.dialog
      // Opens confirm dialog
      .open(SecoDetailDialogComponent, {
        data: {
          dialogTitle: 'LOTTERY.CREATE_TITLE',
          currentSecos: this.approximationsTolds,
          availableSecos: this.prizeProgramService.secondaryPrices,
          showManageItems: this.showManageButtons && this.userAllowedToUpdateInfo
        },
        width: '400px',
        minHeight: '350px',
        minWidth: '350px,'
      })
      .afterClosed()
      .pipe(
        filter(result => result && result.okButton),
      ).subscribe(result => {
        this.approximationsTolds = result.approximationsTolds;
        this.editApproximation(approximation);
      });
  }

  showDetailTable(element) {
    this.expandedElement = this.expandedElement === element ? null : element;
    this.approximationForm.controls['order'].setValue(element.order);
    this.approximationForm.controls['name'].setValue(element.name);
    this.approximationForm.controls['numberMaskRegex'].setValue(element.numberMaskRegex);
    this.approximationForm.controls['totalPrize'].setValue(element.total);
    this.approximationForm.controls['paymentPrize'].setValue(element.payment);
    this.selectedApproximationTo = element.approximationTo;
    this.selectedNumberMaskType = element.numberMaskType;
    this.selectedSerialMaskType = element.seriesMaskType;
    this.approximationsTolds = element.approximationsTolds;
  }


  subuscribeToSelectedPrizeProgramChange() {
    this.prizeProgramService.selectedPrizeProgramChanged$
      .subscribe(prizeProgram => {
        if (this.userAllowedToUpdateInfo && (!prizeProgram || (prizeProgram && (!prizeProgram.approved || prizeProgram.approved === 'NOT_APPROVED')))) {
          this.showManageButtons = true;
          this.displayedColumns = [
            'name',
            'approximationTo',
            'total',
            'manage-buttons'

          ];
        } else {
          this.showManageButtons = false;
          this.displayedColumns = [
            'name',
            'approximationTo',
            'total'

          ];
        }
        if (prizeProgram && prizeProgram.approximations) {
          const newList = prizeProgram.approximations.map(({ __typename, ...item }) => item);
          newList.sort((a, b) => {
            return (a as any).order > (b as any).order ? 1 : -1;
          });
          this.dataSource.data = newList;
          this.prizeProgramService.approximations = newList;
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
