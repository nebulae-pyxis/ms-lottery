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
import {
  TranslateService
} from '@ngx-translate/core';
import { locale as english } from '../../../i18n/en';
import { locale as spanish } from '../../../i18n/es';
import { FuseTranslationLoaderService } from '../../../../../../core/services/translation-loader.service';

//////////// Others ////////////
import { DialogComponent } from '../../../dialog/dialog.component';
import { GameDetailService } from '../../game-detail.service';
import { KeycloakService } from 'keycloak-angular';
import { PrizeProgramService } from '../prize-program.service';

@Component({
  // tslint:disable-next-line:component-selector
  selector: 'game-prize-program-general-info',
  templateUrl: './game-prize-program-general-info.component.html',
  styleUrls: ['./game-prize-program-general-info.component.scss']
})
// tslint:disable-next-line:class-name
export class GamePrizeProgramGeneralInfoComponent implements OnInit, OnDestroy {
  // Subject to unsubscribe
  private ngUnsubscribe = new Subject();

  gameGeneralInfoForm: any;
  gameStateForm: any;
  lotteryId;
  // Stream of filtered client by auto-complete text
  queriedLotteriesByAutocomplete$: Observable<any[]>;
  lotteryName = 'test';
  timeoutMessage = null;
  heightContent;
  selectedType;
  ticketPrice;
  showSaveButton = true;
  showDuplicateButton = false;
  prizeClaimThreshold;
  grandPrizeFormValid = false;

  @Input('game') game: any;
  @Input('selectedPrizeProgram') selectedPrizeProgram: any;

  constructor(
    private translationLoader: FuseTranslationLoaderService,
    private translate: TranslateService,
    public snackBar: MatSnackBar,
    private dialog: MatDialog,
    private prizeProgramService: PrizeProgramService,
    private keycloakService: KeycloakService
  ) {
    this.translationLoader.loadTranslations(english, spanish);
  }


  ngOnInit() {
    this.buildForm();
    this.subuscribeToSelectedPrizeProgramChange();
    this.subscribeGamePrizeProgramUpdated();
    this.buildSubFormListeners();
  }

  buildSubFormListeners() {
    this.prizeProgramService.grandPrizeFormValid$.subscribe(val => {
      this.grandPrizeFormValid = val;
    });
  }

  buildForm() {
    this.gameGeneralInfoForm = new FormGroup({
      prizeClaimThreshold: new FormControl('', [Validators.required]),
      validFromDraw: new FormControl('', [Validators.required]),
      validUntilDraw: new FormControl(''),
    });
  }

  numberOnly(event): boolean {
    const charCode = (event.which) ? event.which : event.keyCode;
    if (charCode > 31 && (charCode < 48 || charCode > 57)) {
      return false;
    }
    return true;
  }

  isGeneralInfoButtonsAllowed() {
    const roles = this.keycloakService.getUserRoles()
      .filter(role => role === 'PLATFORM-ADMIN' || role === 'LOTTERY-ADMIN');
    return  roles && roles.length > 0;
  }

  subuscribeToSelectedPrizeProgramChange() {
    this.prizeProgramService.selectedPrizeProgramChanged$.subscribe(prizeProgram => {
      if (prizeProgram) {
        this.showSaveButton = !prizeProgram.approved || prizeProgram.approved === 'NOT_APPROVED';
        this.showDuplicateButton = prizeProgram.approved === 'APPROVED';
        // TODO: HERE Set all properties of the prize program
        this.gameGeneralInfoForm.controls['validFromDraw'].setValue(prizeProgram.validFromDraw);
        this.gameGeneralInfoForm.controls['validUntilDraw'].setValue(prizeProgram.validUntilDraw);
        this.gameGeneralInfoForm.controls['prizeClaimThreshold'].setValue(prizeProgram.prizeClaimThreshold);

      } else {
        // TODO: HERE reset all properties of the prize program
        this.gameGeneralInfoForm.controls['validFromDraw'].setValue('');
        this.gameGeneralInfoForm.controls['validUntilDraw'].setValue('');
        this.gameGeneralInfoForm.controls['prizeClaimThreshold'].setValue(undefined);
        this.showSaveButton = true;
        this.showDuplicateButton = false;
        this.prizeProgramService.grandPrizeFormValid$.next(false);
      }
      this.selectedPrizeProgram = prizeProgram;
    });
  }
  subscribeGamePrizeProgramUpdated() {
    this.prizeProgramService.subscribeLotteryGamePrizeProgramUpdatedSubscription$()
      .pipe(
        map(subscription => subscription.data.LotteryGamePrizeProgramUpdatedSubscription),
        takeUntil(this.ngUnsubscribe)
      )
      .subscribe((game: any) => {
        this.showSnackBar('LOTTERY.DETAILS.PRIZE_PROGRAM.OPERATION_COMPLETED');
        clearTimeout(this.timeoutMessage);
      });
  }

  createPrizeProgram() {
    if (this.selectedPrizeProgram && this.selectedPrizeProgram.approved === 'NOT_APPROVED') {
      this.showConfirmationDialog$('LOTTERY.UPDATE_MESSAGE', 'LOTTERY.UPDATE_TITLE').pipe(
        tap(ok => this.showWaitOperationMessage()),
        mergeMap(() => {
          const prizeProgram = {
            validFromDraw: parseInt(this.gameGeneralInfoForm.getRawValue().validFromDraw),
            validUntilDraw: parseInt(this.gameGeneralInfoForm.getRawValue().validUntilDraw),
            prizeClaimThreshold: parseInt(this.gameGeneralInfoForm.getRawValue().prizeClaimThreshold),
            grandPrize: this.prizeProgramService.grandPrize,
            twoOutOfThree: this.prizeProgramService.twoOutOfThree,
            secondaryPrices: this.prizeProgramService.secondaryPrices,
            gameId: this.game._id,
            lotteryId: this.game.generalInfo.lotteryId
          };
          return this.prizeProgramService.updateLotteryGamePrizeProgram$(this.selectedPrizeProgram._id, prizeProgram);
        }),
        mergeMap(resp => this.graphQlAlarmsErrorHandler$(resp)),
        filter((resp: any) => !resp.errors || resp.errors.length === 0),
        takeUntil(this.ngUnsubscribe)
      )
        .subscribe(result => { },
          error => {
            this.showErrorOperationMessage();
            console.log('Error ==> ', error);
          });
    } else {
      this.showConfirmationDialog$('LOTTERY.CREATE_MESSAGE', 'LOTTERY.CREATE_TITLE').pipe(
        tap(ok => this.showWaitOperationMessage()),
        mergeMap(() => {
          const prizeProgram = {
            validFromDraw: parseInt(this.gameGeneralInfoForm.getRawValue().validFromDraw),
            validUntilDraw: parseInt(this.gameGeneralInfoForm.getRawValue().validUntilDraw),
            prizeClaimThreshold: parseInt(this.gameGeneralInfoForm.getRawValue().prizeClaimThreshold),
            grandPrize: this.prizeProgramService.grandPrize,
            twoOutOfThree: this.prizeProgramService.twoOutOfThree,
            secondaryPrices: this.prizeProgramService.secondaryPrices,
            gameId: this.game._id,
            lotteryId: this.game.generalInfo.lotteryId
          };
          return this.prizeProgramService.createLotteryGamePrizeProgram$(prizeProgram);
        }),
        mergeMap(resp => this.graphQlAlarmsErrorHandler$(resp)),
        filter((resp: any) => !resp.errors || resp.errors.length === 0),
        takeUntil(this.ngUnsubscribe)
      )
        .subscribe(result => { },
          error => {
            this.showErrorOperationMessage();
            console.log('Error ==> ', error);
          });
     }
  }

  duplicateSelected() {
    const currentPrizeProgram = this.prizeProgramService.selectedPrizeProgramChanged$.getValue();
    this.prizeProgramService.selectedPrizeProgramChanged$.next({
      validFromDraw: currentPrizeProgram.validFromDraw,
      validUntilDraw: currentPrizeProgram.validUntilDraw,
      ticketsPerSheet: currentPrizeProgram.ticketsPerSheet,
      ticketPrice: currentPrizeProgram.ticketPrice
    });
  }

  showWaitOperationMessage() {
    this.timeoutMessage = setTimeout(() => {
      this.showSnackBar('LOTTERY.WAIT_OPERATION');
    }, 2000);
  }

  showErrorOperationMessage() {
    if (this.timeoutMessage) {
      clearTimeout(this.timeoutMessage);
    }
    this.showSnackBar('LOTTERY.ERROR_OPERATION');
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

  showSnackBar(message) {
    this.snackBar.open(this.translationLoader.getTranslate().instant(message),
      this.translationLoader.getTranslate().instant('LOTTERY.CLOSE'), {
        duration: 6000
      });
  }

  graphQlAlarmsErrorHandler$(response) {
    return of(JSON.parse(JSON.stringify(response)))
      .pipe(
        tap((resp: any) => {
          this.showSnackBarError(resp);

          return resp;
        })
      );
  }

  /**
   * Shows an error snackbar
   * @param response
   */
  showSnackBarError(response) {
    if (response.errors) {
      if (this.timeoutMessage) {
        clearTimeout(this.timeoutMessage);
      }
      if (Array.isArray(response.errors)) {
        response.errors.forEach(error => {
          if (Array.isArray(error)) {
            error.forEach(errorDetail => {
              this.showMessageSnackbar('ERRORS.' + errorDetail.message.code);
            });
          } else {
            response.errors.forEach(error => {
              this.showMessageSnackbar('ERRORS.' + error.message.code);
            });
          }
        });
      }
    }
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

    this.translate.get(translationData)
      .subscribe(data => {
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
