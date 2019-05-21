////////// ANGULAR //////////
import {
  Component,
  OnInit,
  OnDestroy,
  ViewChild,
  ElementRef,
  Input
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

import { Subject, fromEvent, of, forkJoin, Observable, concat, combineLatest } from 'rxjs';

//////////// ANGULAR MATERIAL ///////////
import {
  MatPaginator,
  MatSort,
  MatTableDataSource,
  MatSnackBar,
  MatDialog
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
import { LotteryDetailService } from '../lottery-detail.service';
import { DialogComponent } from '../../dialog/dialog.component';
import { ToolbarService } from '../../../../toolbar/toolbar.service';

@Component({
  // tslint:disable-next-line:component-selector
  selector: 'lottery-general-info',
  templateUrl: './lottery-general-info.component.html',
  styleUrls: ['./lottery-general-info.component.scss']
})
// tslint:disable-next-line:class-name
export class LotteryDetailGeneralInfoComponent implements OnInit, OnDestroy {
  // Subject to unsubscribe
  private ngUnsubscribe = new Subject();

  @Input('pageType') pageType: string;
  @Input('lottery') lottery: any;

  lotteryGeneralInfoForm: any;
  lotteryStateForm: any;

  timeoutMessage = null;

  constructor(
    private translationLoader: FuseTranslationLoaderService,
    private translate: TranslateService,
    private formBuilder: FormBuilder,
    public snackBar: MatSnackBar,
    private router: Router,
    private activatedRouter: ActivatedRoute,
    private LotteryDetailService: LotteryDetailService,
    private dialog: MatDialog,
    private toolbarService: ToolbarService
  ) {
    this.translationLoader.loadTranslations(english, spanish);
  }


  ngOnInit() {
    this.subscribeEventUpdated();
    this.lotteryGeneralInfoForm = new FormGroup({
      name: new FormControl(this.lottery ? (this.lottery.generalInfo || {}).name : '', [Validators.required]),
      lotteryCode: new FormControl(this.lottery ? (this.lottery.generalInfo || {}).lotteryCode : '', [Validators.required, Validators.pattern('[^ ]*')]),
      vat: new FormControl(this.lottery ? (this.lottery.generalInfo || {}).vat : '', [Validators.required] ),
      contactName: new FormControl(this.lottery ? (this.lottery.generalInfo || {}).contactName : '', [Validators.required]),
      contactPhone: new FormControl(this.lottery ? (this.lottery.generalInfo || {}).contactPhone : '', [Validators.required]),
      address: new FormControl(this.lottery ? (this.lottery.generalInfo || {}).address : '', [Validators.required]),
      description: new FormControl(this.lottery ? (this.lottery.generalInfo || {}).description : '')
    });

    this.lotteryStateForm = new FormGroup({
      state: new FormControl(this.lottery ? this.lottery.state : true)
    });
  }


  subscribeEventUpdated() {
    this.LotteryDetailService.notifyLotteryLotteryUpdated$
      .pipe(
        takeUntil(this.ngUnsubscribe)
      )
      .subscribe(data => {
        if (this.timeoutMessage) {
          clearTimeout(this.timeoutMessage);
        }
      });
  }

  createLottery() {
    this.showConfirmationDialog$('LOTTERY.CREATE_MESSAGE', 'LOTTERY.CREATE_TITLE')
      .pipe(
        tap(ok => this.showWaitOperationMessage()),
        mergeMap(ok => {
          this.lottery = {
            generalInfo: this.lotteryGeneralInfoForm.getRawValue(),
            state: this.lotteryStateForm.getRawValue().state,
          };
          this.lottery.generalInfo.name = this.lottery.generalInfo.name.toUpperCase();

          return this.LotteryDetailService.createLotteryLottery$(this.lottery);
        }),
        mergeMap(resp => this.graphQlAlarmsErrorHandler$(resp)),
        filter((resp: any) => !resp.errors || resp.errors.length === 0),
        takeUntil(this.ngUnsubscribe)
      ).subscribe(result => { },
        error => {
          this.showErrorOperationMessage();
          console.log('Error ==> ', error);
        }
      );
  }


  updateLotteryGeneralInfo() {
    this.showConfirmationDialog$('LOTTERY.UPDATE_MESSAGE', 'LOTTERY.UPDATE_TITLE')
      .pipe(
        tap(ok => this.showWaitOperationMessage()),
        mergeMap(ok => {
          const generalInfoinput = {
            name: this.lotteryGeneralInfoForm.getRawValue().name.toUpperCase(),
            lotteryCode: this.lotteryGeneralInfoForm.getRawValue().lotteryCode,
            address: this.lotteryGeneralInfoForm.getRawValue().address,
            contactName: this.lotteryGeneralInfoForm.getRawValue().contactName,
            contactPhone: this.lotteryGeneralInfoForm.getRawValue().contactPhone,
            vat: this.lotteryGeneralInfoForm.getRawValue().vat,
            description: this.lotteryGeneralInfoForm.getRawValue().description
          };
          return this.LotteryDetailService.updateLotteryLotteryGeneralInfo$(this.lottery._id, generalInfoinput);
        }),
        mergeMap(resp => this.graphQlAlarmsErrorHandler$(resp)),
        filter((resp: any) => !resp.errors || resp.errors.length === 0),
        takeUntil(this.ngUnsubscribe)
      )
      .subscribe(result => { },
        error => {
          this.showErrorOperationMessage();
          console.log('Error ==> ', error);
        }
      );

  }

  onLotteryStateChange() {
    this.showConfirmationDialog$('LOTTERY.UPDATE_MESSAGE', 'LOTTERY.UPDATE_TITLE')
      .pipe(
        tap(ok => this.showWaitOperationMessage()),
        mergeMap(ok => {
          return this.LotteryDetailService.updateLotteryLotteryState$(this.lottery._id, this.lotteryStateForm.getRawValue().state);
        }),
        mergeMap(resp => this.graphQlAlarmsErrorHandler$(resp)),
        filter((resp: any) => !resp.errors || resp.errors.length === 0),
        takeUntil(this.ngUnsubscribe)
      ).subscribe(result => { },
        error => {
          this.showErrorOperationMessage();
          console.log('Error ==> ', error);
        });
  }

  numberOnly(event): boolean {
    const charCode = (event.which) ? event.which : event.keyCode;
    if (charCode > 31 && (charCode < 48 || charCode > 57)) {
      return false;
    }
    return true;

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
