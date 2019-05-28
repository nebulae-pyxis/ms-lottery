////////// ANGULAR //////////
import {
  Component,
  OnInit,
  OnDestroy,
  Input,
  ViewChild,
  ElementRef,
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

import tableDragger from 'table-dragger';

//////////// i18n ////////////

import { locale as english } from '../../../../i18n/en';
import { locale as spanish } from '../../../../i18n/es';
import { FuseTranslationLoaderService } from '../../../../../../../core/services/translation-loader.service';

import { PrizeProgramService } from '../../prize-program.service';

import { v4 as uuid } from 'uuid';
import { DialogComponent } from '../../../../dialog/dialog.component';
import { ApproximationDialogComponent } from './approximation-dialog/approximation-dialog.component';

@Component({
  // tslint:disable-next-line:component-selector
  selector: 'prize-program-approximation',
  templateUrl: './prize-program-approximation.component.html',
  styleUrls: ['./prize-program-approximation.component.scss']
})
// tslint:disable-next-line:class-name
export class PrizeProgramApproximationComponent implements OnInit, OnDestroy {
  // Subject to unsubscribe
  private ngUnsubscribe = new Subject();

  // Stream of filtered client by auto-complete text
  approximationChanged = new Subject();
  dataSource = new MatTableDataSource();
  displayedColumns = [
    'name',
    'quantity',
    'total',
    'manage-buttons'

  ];
  selectedApproximation;
  constructor(
    private translationLoader: FuseTranslationLoaderService,
    public snackBar: MatSnackBar,
    private dialog: MatDialog,
    private prizeProgramService: PrizeProgramService,
  ) {
    this.translationLoader.loadTranslations(english, spanish);
  }


  ngOnInit() {
    this.subuscribeToSelectedPrizeProgramChange();
  }

  createApproximation() {
    this.dialog
      // Opens confirm dialog
      .open(ApproximationDialogComponent, {
        data: {
          dialogTitle: 'LOTTERY.CREATE_TITLE',
          approximationSelected: {}
        }
      })
      .afterClosed()
      .pipe(
        filter(result => result && result.okButton),
        map(({ name, payment, quantity, total, withSerie }) => {
          const secondaryPrices = this.dataSource.data && this.dataSource.data.length > 0 ? this.dataSource.data : [];
          secondaryPrices.push({ id: uuid(), name, payment, quantity, total, withSerie });
          return secondaryPrices;
        })
      ).subscribe(result => {
        this.prizeProgramService.secondaryPrices = result;
        this.dataSource.data = result;
        console.log(result);
      });
  }

  editApproximation(approximation) {
    this.dialog
      // Opens confirm dialog
      .open(ApproximationDialogComponent, {
        data: {
          dialogTitle: 'LOTTERY.UPDATE_TITLE',
          approximationSelected: approximation
        }
      })
      .afterClosed()
      .pipe(
        filter(result => result && result.okButton),
        map(({ name, payment, total, quantity, withSerie }) => {
          let secondaryPrices = this.dataSource.data && this.dataSource.data.length > 0 ? this.dataSource.data : [];
          secondaryPrices = secondaryPrices.filter(seco =>
            (seco as any).id !== approximation.id
          );
          secondaryPrices.push({ name, payment, total, quantity, withSerie });
          return secondaryPrices;
        })
      ).subscribe(result => {
        this.prizeProgramService.secondaryPrices = result;
        this.dataSource.data = result;
        console.log(result);
      });
  }

  removeApproximation(approximation) {
    this.showConfirmationDialog$('LOTTERY.REMOVE_MESSAGE', 'LOTTERY.REMOVE_TITLE')
      .subscribe(() => {
        let currentList = this.dataSource.data;
        currentList = currentList.filter(seco =>
          (seco as any).id !== approximation.id
        );
        this.prizeProgramService.secondaryPrices = currentList;
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

  subuscribeToSelectedPrizeProgramChange() {
    this.prizeProgramService.selectedPrizeProgramChanged$
      .subscribe(prizeProgram => {
        if (!prizeProgram || (prizeProgram && (!prizeProgram.approved || prizeProgram.approved === 'NOT_APPROVED'))) {
          this.displayedColumns = [
            'name',
            'quantity',
            'total',
            'manage-buttons'

          ];
        } else {
          this.displayedColumns = [
            'name',
            'quantity',
            'total'
          ];
        }
        if (prizeProgram && prizeProgram.secondaryPrices) {
          const newList = prizeProgram.secondaryPrices.map(({ __typename, ...item }) => item);
          this.dataSource.data = newList;
          this.prizeProgramService.secondaryPrices = newList;
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
