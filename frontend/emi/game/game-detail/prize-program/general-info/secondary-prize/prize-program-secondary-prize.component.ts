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
import { SecondaryPrizeDialogComponent } from './secondary-prize-dialog/secondary-prize-dialog.component';

import { v4 as uuid } from 'uuid';
import { DialogComponent } from '../../../../dialog/dialog.component';
import {animate, state, style, transition, trigger} from '@angular/animations';
import { KeycloakService } from 'keycloak-angular';


@Component({
  // tslint:disable-next-line:component-selector
  selector: 'prize-program-secondary-prize',
  templateUrl: './prize-program-secondary-prize.component.html',
  styleUrls: ['./prize-program-secondary-prize.component.scss'],
  animations: [
    trigger('detailExpand', [
      state('collapsed', style({height: '0px', minHeight: '0', display: 'none'})),
      state('expanded', style({height: '*'})),
      transition('expanded <=> collapsed', animate('225ms cubic-bezier(0.4, 0.0, 0.2, 1)')),
    ]),
  ],
})
// tslint:disable-next-line:class-name
export class PrizeProgramSecondaryPrizeComponent implements OnInit, OnDestroy {
  // Subject to unsubscribe
  private ngUnsubscribe = new Subject();

  // Stream of filtered client by auto-complete text
  secondaryPrizeChanged = new Subject();
  dataSource = new MatTableDataSource();
  expandedElement: any;
  displayedColumns = [
    'name',
    'quantity',
    'total',
    'manage-buttons'

  ];
  secondaryPrizeForm: FormGroup;
  totalPrize;
  paymentPrize;
  withSerie = true;
  selectedSecondaryPrize;
  showManageButtons = false;
  userAllowedToUpdateInfo = false;

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
    this.secondaryPrizeForm = new FormGroup({
      name: new FormControl('', [Validators.required]),
      quantity: new FormControl('', [Validators.required]),
      totalPrize: new FormControl('', [Validators.required]),
      paymentPrize: new FormControl('', [Validators.required]),
    });
    !this.userAllowedToUpdateInfo ? this.secondaryPrizeForm.disable() : this.secondaryPrizeForm.enable();
  }

  createSecondaryPrize() {
    this.dialog
      // Opens confirm dialog
      .open(SecondaryPrizeDialogComponent, {
        data: {
          dialogTitle: 'LOTTERY.CREATE_TITLE',
          secondaryPrizeSelected: {}
        }
      })
      .afterClosed()
      .pipe(
        filter(result => result && result.okButton),
        map(({ name, payment, quantity, total, withSerie }) => {
          const secondaryPrices = this.dataSource.data && this.dataSource.data.length > 0 ? this.dataSource.data : [];
          secondaryPrices.push({ id:  uuid(), name, payment, quantity, total, withSerie });
          return secondaryPrices;
        })
      ).subscribe(result => {
        this.prizeProgramService.secondaryPrices = result;
        result.sort((a, b) => {
          return (a as any).name > (b as any).name ? 1 : -1;
        });
        this.dataSource.data = result;
        console.log(result);
      });
  }

  editSecondaryPrize(secondaryPrize) {
    this.showConfirmationDialog$('LOTTERY.UPDATE_MESSAGE', 'LOTTERY.UPDATE_TITLE')
      .pipe(
        map(() => {
          let secondaryPrices = this.dataSource.data && this.dataSource.data.length > 0 ? this.dataSource.data : [];
          secondaryPrices = secondaryPrices.filter(seco =>
            (seco as any).id !== secondaryPrize.id
          );
          secondaryPrices.push({
            id: secondaryPrize.id,
            name: this.secondaryPrizeForm.controls['name'].value,
            quantity: parseInt(this.secondaryPrizeForm.controls['quantity'].value),
            total: parseInt(this.secondaryPrizeForm.controls['totalPrize'].value),
            payment: parseInt(this.secondaryPrizeForm.controls['paymentPrize'].value),
            withSerie: this.withSerie
          });
          secondaryPrices.sort((a, b) => {
            return (a as any).name > (b as any).name ? 1 : -1;
          });
          return secondaryPrices;
        })
      ).subscribe(result => {
        this.prizeProgramService.secondaryPrices = result;
        this.dataSource.data = result;
      });
  }

  removeSecondaryPrize(secondaryPrize) {
    this.showConfirmationDialog$('LOTTERY.REMOVE_MESSAGE', 'LOTTERY.REMOVE_TITLE').pipe(
      map(() => {
        let currentList = this.dataSource.data;
        currentList = currentList.filter(seco =>
          (seco as any).id !== secondaryPrize.id
        );
        currentList.sort((a, b) => {
          return (a as any).name > (b as any).name ? 1 : -1;
        });
        return currentList;
      }),
      tap(result => {
        this.prizeProgramService.secondaryPrices = result;
        this.dataSource.data = result;
      }),
      mergeMap(() => {
        return from(this.prizeProgramService.approximations).pipe(
          map(approximation => {
            console.log('Lista inicial: ', approximation.approximationsTolds);
            if (approximation.approximationsTolds) {
              approximation.approximationsTolds = approximation.approximationsTolds
                .filter(approximationTold => {
                  console.log('Id a eliminar: ' + secondaryPrize.id + ' id evaluado: ', approximationTold);
                  return approximationTold !== secondaryPrize.id;
                });
            }
            return approximation;
          }),
          toArray(),
          tap(result => {
            console.log('lista final: ', result);
            this.prizeProgramService.approximations = result;
          })
        );
      })
    )
      .subscribe(result => {
      });
  }


  selectSecondaryPrizeRow(prizeProgram) {
    this.selectedSecondaryPrize = prizeProgram;
  }

  numberOnly(event): boolean {
    const charCode = (event.which) ? event.which : event.keyCode;
    if (charCode > 31 && (charCode < 48 || charCode > 57)) {
      return false;
    }
    return true;
  }

  showDetailTable(element) {
    this.expandedElement = this.expandedElement === element ? null : element;
    this.secondaryPrizeForm.controls['name'].setValue(element.name);
    this.secondaryPrizeForm.controls['quantity'].setValue(element.quantity);
    this.secondaryPrizeForm.controls['totalPrize'].setValue(element.total);
    this.secondaryPrizeForm.controls['paymentPrize'].setValue(element.payment);
    this.withSerie = element.withSerie;
  }

  changeWithSerie() {
    this.withSerie = ((this.ref as any).checked);
  }

  subuscribeToSelectedPrizeProgramChange() {
    this.prizeProgramService.selectedPrizeProgramChanged$
      .subscribe(prizeProgram => {
        if (this.userAllowedToUpdateInfo && (!prizeProgram || (prizeProgram && (!prizeProgram.approved || prizeProgram.approved === 'NOT_APPROVED')))) {
          this.showManageButtons = true;
          this.displayedColumns = [
            'name',
            'quantity',
            'total',
            'manage-buttons'

          ];
        } else {
          this.showManageButtons = false;
          this.displayedColumns = [
            'name',
            'quantity',
            'total'

          ];
        }
        if (prizeProgram && prizeProgram.secondaryPrices) {
          const newList = prizeProgram.secondaryPrices.map(({ __typename, ...item }) => item);
          newList.sort((a, b) => {
            return (a as any).name > (b as any).name ? 1 : -1;
          });
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
