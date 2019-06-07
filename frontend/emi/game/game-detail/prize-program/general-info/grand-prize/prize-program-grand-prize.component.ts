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

import { PrizeProgramService } from '../../prize-program.service';
import { KeycloakService } from 'keycloak-angular';

@Component({
  // tslint:disable-next-line:component-selector
  selector: 'prize-program-grand-prize',
  templateUrl: './prize-program-grand-prize.component.html',
  styleUrls: ['./prize-program-grand-prize.component.scss']
})
// tslint:disable-next-line:class-name
export class PrizeProgramGrandPrizeComponent implements OnInit, OnDestroy {
  // Subject to unsubscribe
  private ngUnsubscribe = new Subject();

  prizeProgramForm: any;
  lotteryId;
  // Stream of filtered client by auto-complete text
  queriedLotteriesByAutocomplete$: Observable<any[]>;
  totalPrize;
  paymentPrize;
  grandPrizeChanged = new Subject();
  userAllowedToUpdateInfo = false;

  constructor(
    private translationLoader: FuseTranslationLoaderService,
    public snackBar: MatSnackBar,
    private prizeProgramService: PrizeProgramService,
    private keycloakService: KeycloakService
  ) {
    this.translationLoader.loadTranslations(english, spanish);
  }


  ngOnInit() {
    this.userAllowedToUpdateInfo = this.keycloakService.getUserRoles(true).some(role => role === 'LOTTERY-ADMIN' || role === 'PLATFORM-ADMIN');
    this.buildForm();
    this.subuscribeToSelectedPrizeProgramChange();
    this.listenFormaChanges();
  }

  listenFormaChanges() {
    this.grandPrizeChanged.pipe(
      debounceTime(500)
    ).subscribe(grandPrize => {
      this.prizeProgramService.grandPrizeFormValid$.next(!this.prizeProgramForm.invalid);
    });
  }

  buildForm() {
    this.prizeProgramForm = new FormGroup({
      totalPrize: new FormControl('', [Validators.required]),
      paymentPrize: new FormControl('', [Validators.required]),
    });
    !this.userAllowedToUpdateInfo ? this.prizeProgramForm.disable() : this.prizeProgramForm.enable();
  }

  totalPrizeChanged(event) {
    const grandPrize = !this.prizeProgramService.grandPrize ? {} : this.prizeProgramService.grandPrize;
    grandPrize.total = event;
    this.prizeProgramService.grandPrize = grandPrize;
    this.grandPrizeChanged.next(grandPrize);
  }

  paymentPrizeChanged(event) {
    const grandPrize = !this.prizeProgramService.grandPrize ? {} : this.prizeProgramService.grandPrize;
    grandPrize.payment = event;
    this.prizeProgramService.grandPrize = grandPrize;
    this.grandPrizeChanged.next(grandPrize);
  }

  numberOnly(event): boolean {
    const charCode = (event.which) ? event.which : event.keyCode;
    if (charCode > 31 && (charCode < 48 || charCode > 57)) {
      return false;
    }
    return true;
  }

  subuscribeToSelectedPrizeProgramChange() {
    this.prizeProgramService.selectedPrizeProgramChanged$.subscribe(prizeProgram => {
      if (prizeProgram && prizeProgram.grandPrize) {
        // TODO: HERE Set all properties of the prize program
        this.prizeProgramForm.controls['totalPrize'].setValue(prizeProgram.grandPrize.total);
        this.prizeProgramForm.controls['paymentPrize'].setValue(prizeProgram.grandPrize.payment);
        this.prizeProgramService.grandPrizeFormValid$.next(!this.prizeProgramForm.invalid);
      } else {
        // TODO: HERE reset all properties of the prize program
        this.prizeProgramForm.controls['totalPrize'].setValue(undefined);
        this.prizeProgramForm.controls['paymentPrize'].setValue(undefined);
      }
    });
  }

  ngOnDestroy() {
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
  }

}
