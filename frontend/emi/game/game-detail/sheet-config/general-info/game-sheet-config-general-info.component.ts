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

@Component({
  // tslint:disable-next-line:component-selector
  selector: 'game-sheet-config-general-info',
  templateUrl: './game-sheet-config-general-info.component.html',
  styleUrls: ['./game-sheet-config-general-info.component.scss']
})
// tslint:disable-next-line:class-name
export class GameSheetConfigGeneralInfoComponent implements OnInit, OnDestroy {
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

  @Input('game') game: any;
  @Input('selectedConfigSheet') selectedConfigSheet: any;

  constructor(
    private translationLoader: FuseTranslationLoaderService,
    private translate: TranslateService,
    public snackBar: MatSnackBar,
    private dialog: MatDialog,
    private gameDetailService: GameDetailService
  ) {
    this.translationLoader.loadTranslations(english, spanish);
  }


  ngOnInit() {
    this.gameGeneralInfoForm = new FormGroup({
      ticketsPerSheet: new FormControl('', [Validators.required]),
      ticketPrice: new FormControl('', [Validators.required]),
      validFromDraw: new FormControl('', [Validators.required]),
      validUntilDraw: new FormControl(''),
    });
    this.subuscribeToSelectedSheetConfigChange();
    this.subscribeGameSheetConfigUpdated();
  }

  numberOnly(event): boolean {
    const charCode = (event.which) ? event.which : event.keyCode;
    if (charCode > 31 && (charCode < 48 || charCode > 57)) {
      return false;
    }
    return true;
  }

  subuscribeToSelectedSheetConfigChange() {
    this.gameDetailService.selectedConfigSheetChanged$.subscribe(configSheet => {
      if (configSheet) {
        this.showSaveButton = !configSheet.approved || configSheet.approved === 'NOT_APPROVED';
        this.showDuplicateButton = configSheet.approved === 'APPROVED';
        this.gameGeneralInfoForm.controls['ticketsPerSheet'].setValue(configSheet.ticketsPerSheet);
        this.gameGeneralInfoForm.controls['ticketPrice'].setValue(configSheet.ticketPrice);
        this.gameGeneralInfoForm.controls['validFromDraw'].setValue(configSheet.validFromDraw);
        this.gameGeneralInfoForm.controls['validUntilDraw'].setValue(configSheet.validUntilDraw);
      } else {
        this.gameGeneralInfoForm.controls['ticketsPerSheet'].setValue('');
        this.gameGeneralInfoForm.controls['ticketPrice'].setValue('');
        this.gameGeneralInfoForm.controls['validFromDraw'].setValue('');
        this.gameGeneralInfoForm.controls['validUntilDraw'].setValue('');
        this.showSaveButton = true;
        this.showDuplicateButton = false;
      }
      this.selectedConfigSheet = configSheet;
    });
  }
  subscribeGameSheetConfigUpdated() {
    this.gameDetailService.subscribeLotteryGameSheetConfigUpdatedSubscription$()
      .pipe(
        map(subscription => subscription.data.LotteryGameSheetConfigUpdatedSubscription),
        takeUntil(this.ngUnsubscribe)
      )
      .subscribe((game: any) => {
        this.showSnackBar('LOTTERY.DETAILS.CONFIG_SHEET.OPERATION_COMPLETED');
        clearTimeout(this.timeoutMessage);
      });
  }

  createConfigSheet() {
    if (this.selectedConfigSheet && this.selectedConfigSheet.approved === 'NOT_APPROVED') {
      this.showConfirmationDialog$('LOTTERY.UPDATE_MESSAGE', 'LOTTERY.UPDATE_TITLE').pipe(
        tap(ok => this.showWaitOperationMessage()),
        mergeMap(() => {
          const configSheet = {
            validFromDraw: parseInt(this.gameGeneralInfoForm.getRawValue().validFromDraw),
            validUntilDraw: parseInt(this.gameGeneralInfoForm.getRawValue().validUntilDraw),
            ticketsPerSheet: parseInt(this.gameGeneralInfoForm.getRawValue().ticketsPerSheet),
            ticketPrice: parseInt(this.ticketPrice),
            gameId: this.game._id,
            lotteryId: this.game.generalInfo.lotteryId
          };
          return this.gameDetailService.updateLotteryGameSheetConfig$(this.selectedConfigSheet._id, configSheet);
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
      console.log('entra a crear');
      this.showConfirmationDialog$('LOTTERY.CREATE_MESSAGE', 'LOTTERY.CREATE_TITLE').pipe(
        tap(ok => this.showWaitOperationMessage()),
        mergeMap(() => {
          const configSheet = {
            validFromDraw: parseInt(this.gameGeneralInfoForm.getRawValue().validFromDraw),
            validUntilDraw: parseInt(this.gameGeneralInfoForm.getRawValue().validUntilDraw),
            ticketsPerSheet: parseInt(this.gameGeneralInfoForm.getRawValue().ticketsPerSheet),
            ticketPrice: parseInt(this.ticketPrice),
            gameId: this.game._id,
            lotteryId: this.game.generalInfo.lotteryId
          };
          return this.gameDetailService.createLotteryGameSheetConfig$(configSheet);
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
    const currentConfigSheet = this.gameDetailService.selectedConfigSheetChanged$.getValue();
    this.gameDetailService.selectedConfigSheetChanged$.next({
      validFromDraw: currentConfigSheet.validFromDraw,
      validUntilDraw: currentConfigSheet.validUntilDraw,
      ticketsPerSheet: currentConfigSheet.ticketsPerSheet,
      ticketPrice: currentConfigSheet.ticketPrice
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
