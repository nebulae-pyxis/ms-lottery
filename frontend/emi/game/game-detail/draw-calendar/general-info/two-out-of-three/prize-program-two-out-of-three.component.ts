////////// ANGULAR //////////
import {
  Component,
  OnInit,
  OnDestroy,
  Input,
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

import { Subject, fromEvent, of, forkJoin, Observable, concat, combineLatest, iif } from 'rxjs';

//////////// ANGULAR MATERIAL ///////////
import {
  MatSnackBar,
  MatDialog
} from '@angular/material';

//////////// i18n ////////////

import { locale as english } from '../../../../i18n/en';
import { locale as spanish } from '../../../../i18n/es';
import { FuseTranslationLoaderService } from '../../../../../../../core/services/translation-loader.service';
import { PrizeProgramService } from '../../../prize-program/prize-program.service';

@Component({
  // tslint:disable-next-line:component-selector
  selector: 'prize-program-two-out-of-three',
  templateUrl: './prize-program-two-out-of-three.component.html',
  styleUrls: ['./prize-program-two-out-of-three.component.scss']
})
// tslint:disable-next-line:class-name
export class PrizeProgramTwoOutOfThreeComponent implements OnInit, OnDestroy {
  // Subject to unsubscribe
  private ngUnsubscribe = new Subject();

  prizeProgramForm: any;
  // Stream of filtered client by auto-complete text
  queriedLotteriesByAutocomplete$: Observable<any[]>;
  duoTotal;
  duoPayment;
  singleTotal;
  singlePayment;
  twoOutOfThreeChanged = new Subject();

  constructor(
    private translationLoader: FuseTranslationLoaderService,
    public snackBar: MatSnackBar,
    private prizeProgramService: PrizeProgramService,
  ) {
    this.translationLoader.loadTranslations(english, spanish);
  }


  ngOnInit() {
    this.buildForm();
    this.subuscribeToSelectedPrizeProgramChange();
  }

  buildForm() {
    this.prizeProgramForm = new FormGroup({
      name: new FormControl('', []),
      duoTotal: new FormControl('', []),
      duoPayment: new FormControl('', []),
      singleTotal: new FormControl('', []),
      singlePayment: new FormControl('', []),
    });
  }

  nameChanged(event) {
    const twoOutOfThree = !this.prizeProgramService.twoOutOfThree ? {} : this.prizeProgramService.twoOutOfThree;
    twoOutOfThree.name = event;
    this.prizeProgramService.twoOutOfThree = twoOutOfThree;
  }

  duoTotalChanged(event) {
    const twoOutOfThree = !this.prizeProgramService.twoOutOfThree ? {} : this.prizeProgramService.twoOutOfThree;
    twoOutOfThree.duoTotal = event;
    this.prizeProgramService.twoOutOfThree = twoOutOfThree;
  }

  duoPaymentChanged(event) {
    const twoOutOfThree = !this.prizeProgramService.twoOutOfThree ? {} : this.prizeProgramService.twoOutOfThree;
    twoOutOfThree.duoPayment = event;
    this.prizeProgramService.twoOutOfThree = twoOutOfThree;
  }

  singleTotalChanged(event) {
    const twoOutOfThree = !this.prizeProgramService.twoOutOfThree ? {} : this.prizeProgramService.twoOutOfThree;
    twoOutOfThree.singleTotal = event;
    this.prizeProgramService.twoOutOfThree = twoOutOfThree;
  }

  singlePaymentChanged(event) {
    const twoOutOfThree = !this.prizeProgramService.twoOutOfThree ? {} : this.prizeProgramService.twoOutOfThree;
    twoOutOfThree.singlePayment = event;
    this.prizeProgramService.twoOutOfThree = twoOutOfThree;
  }

  numberOnly(event): boolean {
    const charCode = (event.which) ? event.which : event.keyCode;
    if (charCode > 31 && (charCode < 48 || charCode > 57)) {
      return false;
    }
    return true;
  }

  subuscribeToSelectedPrizeProgramChange() {
    this.prizeProgramService.selectedPrizeProgramChanged$.pipe(
      debounceTime(300)
    ).subscribe(prizeProgram => {
      if (prizeProgram && prizeProgram.twoOutOfThree) {
        this.prizeProgramForm.controls['name'].setValue(prizeProgram.twoOutOfThree.name);
        this.prizeProgramForm.controls['duoTotal'].setValue(prizeProgram.twoOutOfThree.duoTotal);
        this.prizeProgramForm.controls['duoPayment'].setValue(prizeProgram.twoOutOfThree.duoPayment);
        this.prizeProgramForm.controls['singleTotal'].setValue(prizeProgram.twoOutOfThree.singleTotal);
        this.prizeProgramForm.controls['singlePayment'].setValue(prizeProgram.twoOutOfThree.singlePayment);

      } else {
        // TODO: HERE reset all properties of the prize program
        this.prizeProgramForm.controls['name'].setValue(undefined);
        this.prizeProgramForm.controls['duoTotal'].setValue(undefined);
        this.prizeProgramForm.controls['duoPayment'].setValue(undefined);
        this.prizeProgramForm.controls['singleTotal'].setValue(undefined);
        this.prizeProgramForm.controls['singlePayment'].setValue(undefined);
      }
    });
  }

  ngOnDestroy() {
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
  }

}
