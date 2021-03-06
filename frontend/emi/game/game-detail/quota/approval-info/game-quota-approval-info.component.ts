////////// ANGULAR //////////
import {
  Component,
  OnInit,
  OnDestroy,
  ViewChild,
  ElementRef,
  Input,
  HostListener,
  ChangeDetectorRef
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
import { QuotaService } from '../quota.service';
import { NoteDialogComponent } from '../../../note-dialog/note-dialog.component';
import { DatePipe } from '@angular/common';
import { KeycloakService } from 'keycloak-angular';

@Component({
  // tslint:disable-next-line:component-selector
  selector: 'game-quota-approval-info',
  templateUrl: './game-quota-approval-info.component.html',
  styleUrls: ['./game-quota-approval-info.component.scss']
})
// tslint:disable-next-line:class-name
export class GameQuotaApprovalInfoComponent implements OnInit, OnDestroy {
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
  @Input('selectedQuota') selectedQuota: any;

  constructor(
    private translationLoader: FuseTranslationLoaderService,
    private translate: TranslateService,
    public snackBar: MatSnackBar,
    private dialog: MatDialog,
    private quotaService: QuotaService,
    private datePipe: DatePipe,
    private keycloakService: KeycloakService
  ) {
    this.translationLoader.loadTranslations(english, spanish);
  }


  ngOnInit() {
    this.initializeForm();
    this.subscribeToSelectedVersion();
    this.subscribeGameQuotaUpdated();
  }

  isApproveButtonsAllowed() {
    const roles = this.keycloakService.getUserRoles()
      .filter(role => role === 'PLATFORM-ADMIN' || role === 'LOTTERY-APPROVER');
    return  roles && roles.length > 0;
  }

  subscribeGameQuotaUpdated() {
    this.quotaService.subscribeLotteryGameQuotaUpdatedSubscription$()
      .pipe(
        map(subscription => subscription.data.LotteryGameQuotaUpdatedSubscription),
        takeUntil(this.ngUnsubscribe)
      )
      .subscribe((game: any) => {
        clearTimeout(this.timeoutMessage);
      });
  }


  initializeForm() {
    this.gameGeneralInfoForm = new FormGroup({
      approved: new FormControl(''),
      approvedIn: new FormControl(''),
      approvalUsername: new FormControl(''),
      approvalNotes: new FormControl(''),
      revokedIn: new FormControl(''),
      revokedUsername: new FormControl(''),
      revokedNotes: new FormControl(''),
    });
  }
  subscribeToSelectedVersion() {
    this.quotaService.selectedQuotaChanged$.subscribe(quota => {
      if (quota) {
        this.gameGeneralInfoForm.controls['approved'].setValue(
          this.translationLoader.getTranslate().instant(quota && quota.revoked ? 'LOTTERY.DETAILS.CONFIG_SHEET.REVOKED'
            : !quota.approved ? 'LOTTERY.DETAILS.CONFIG_SHEET.PENDING'
            : 'LOTTERY.DETAILS.CONFIG_SHEET.' + quota.approved)
        );
        this.gameGeneralInfoForm.controls['approvedIn'].setValue(this.datePipe.transform(quota.approvedTimestamp, 'short'));
        this.gameGeneralInfoForm.controls['approvalUsername'].setValue(quota.approvedUsername);
        this.gameGeneralInfoForm.controls['approvalNotes'].setValue(quota.approvedNotes);
        this.gameGeneralInfoForm.controls['revokedIn'].setValue(this.datePipe.transform(quota.revokedTimestamp, 'short'));
        this.gameGeneralInfoForm.controls['revokedUsername'].setValue(quota.revokedUsername);
        this.gameGeneralInfoForm.controls['revokedNotes'].setValue(quota.revokedNotes);
        this.selectedQuota = quota;
      }
    });
  }

  declineQuota() {
    this.showNoteDialog$('LOTTERY.DETAILS.CONFIG_SHEET.DECLINE_MESSAGE', 'LOTTERY.DETAILS.CONFIG_SHEET.DECLINE_TITTLE')
      .pipe(
        tap(ok => this.showWaitOperationMessage()),
        mergeMap(result => {
          return this.quotaService.approveLotteryGameQuota$(this.selectedQuota._id, 'NOT_APPROVED', result.notes);
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

  approveQuota() {
    this.showConfirmationDialog$('LOTTERY.DETAILS.CONFIG_SHEET.APPROVE_MESSAGE', 'LOTTERY.DETAILS.CONFIG_SHEET.APPROVE_TITTLE')
      .pipe(
        tap(ok => this.showWaitOperationMessage()),
        mergeMap(() => {
          return this.quotaService.approveLotteryGameQuota$(this.selectedQuota._id, 'APPROVED', '');
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

  revokeQuota() {
    this.showNoteDialog$('LOTTERY.DETAILS.CONFIG_SHEET.REVOKE_MESSAGE', 'LOTTERY.DETAILS.CONFIG_SHEET.REVOKE_TITTLE')
      .pipe(
        tap(ok => this.showWaitOperationMessage()),
        mergeMap(result => {
          return this.quotaService.revokeLotteryGameQuota$(this.selectedQuota._id, true, result.notes);
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

  showNoteDialog$(dialogMessage, dialogTitle) {
    return this.dialog
      // Opens confirm dialog
      .open(NoteDialogComponent, {
        data: {
          dialogMessage,
          dialogTitle
        }
      })
      .afterClosed()
      .pipe(
        filter(result => result && result.okButton),
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
