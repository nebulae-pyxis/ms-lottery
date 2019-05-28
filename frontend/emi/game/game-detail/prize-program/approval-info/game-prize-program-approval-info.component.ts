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
import { GameDetailService } from '../../game-detail.service';
import { NoteDialogComponent } from '../../../note-dialog/note-dialog.component';
import { DatePipe } from '@angular/common';
import { KeycloakService } from 'keycloak-angular';
import { PrizeProgramService } from '../prize-program.service';

@Component({
  // tslint:disable-next-line:component-selector
  selector: 'game-prize-program-approval-info',
  templateUrl: './game-prize-program-approval-info.component.html',
  styleUrls: ['./game-prize-program-approval-info.component.scss']
})
// tslint:disable-next-line:class-name
export class GamePrizeProgramApprovalInfoComponent implements OnInit, OnDestroy {
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
  @Input('selectedPrizeProgram') selectedPrizeProgram: any;

  constructor(
    private translationLoader: FuseTranslationLoaderService,
    private translate: TranslateService,
    public snackBar: MatSnackBar,
    private dialog: MatDialog,
    private prizeProgramService: PrizeProgramService,
    private datePipe: DatePipe,
    private keycloakService: KeycloakService
  ) {
    this.translationLoader.loadTranslations(english, spanish);
  }


  ngOnInit() {
    this.initializeForm();
    this.subscribeToSelectedVersion();
    this.subscribeGamePrizeProgramUpdated();
  }

  isApproveButtonsAllowed() {
    const roles = this.keycloakService.getUserRoles()
      .filter(role => role === 'PLATFORM-ADMIN' || role === 'LOTTERY-APPROVER');
    return  roles && roles.length > 0;
  }

  subscribeGamePrizeProgramUpdated() {
    this.prizeProgramService.subscribeLotteryGamePrizeProgramUpdatedSubscription$()
      .pipe(
        map(subscription => subscription.data.LotteryGamePrizeProgramUpdatedSubscription),
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
    this.prizeProgramService.selectedPrizeProgramChanged$.subscribe(prizeProgram => {
      if (prizeProgram) {
        this.gameGeneralInfoForm.controls['approved'].setValue(
          this.translationLoader.getTranslate().instant(prizeProgram && prizeProgram.revoked ? 'LOTTERY.DETAILS.PRIZE_PROGRAM.REVOKED'
            : !prizeProgram.approved ? 'LOTTERY.DETAILS.PRIZE_PROGRAM.PENDING'
            : 'LOTTERY.DETAILS.PRIZE_PROGRAM.' + prizeProgram.approved)
        );
        this.gameGeneralInfoForm.controls['approvedIn'].setValue(this.datePipe.transform(prizeProgram.approvedTimestamp, 'short'));
        this.gameGeneralInfoForm.controls['approvalUsername'].setValue(prizeProgram.approvedUsername);
        this.gameGeneralInfoForm.controls['approvalNotes'].setValue(prizeProgram.approvedNotes);
        this.gameGeneralInfoForm.controls['revokedIn'].setValue(this.datePipe.transform(prizeProgram.revokedTimestamp, 'short'));
        this.gameGeneralInfoForm.controls['revokedUsername'].setValue(prizeProgram.revokedUsername);
        this.gameGeneralInfoForm.controls['revokedNotes'].setValue(prizeProgram.revokedNotes);
        this.selectedPrizeProgram = prizeProgram;
      }
    });
  }

  declinePrizeProgram() {
    this.showNoteDialog$('LOTTERY.DETAILS.PRIZE_PROGRAM.DECLINE_MESSAGE', 'LOTTERY.DETAILS.PRIZE_PROGRAM.DECLINE_TITTLE')
      .pipe(
        tap(ok => this.showWaitOperationMessage()),
        mergeMap(result => {
          return this.prizeProgramService.approveLotteryGamePrizeProgram$(this.selectedPrizeProgram._id, 'NOT_APPROVED', result.notes);
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

  approvePrizeProgram() {
    this.showConfirmationDialog$('LOTTERY.DETAILS.PRIZE_PROGRAM.APPROVE_MESSAGE', 'LOTTERY.DETAILS.PRIZE_PROGRAM.APPROVE_TITTLE')
      .pipe(
        tap(ok => this.showWaitOperationMessage()),
        mergeMap(() => {
          return this.prizeProgramService.approveLotteryGamePrizeProgram$(this.selectedPrizeProgram._id, 'APPROVED', '');
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

  revokePrizeProgram() {
    this.showNoteDialog$('LOTTERY.DETAILS.PRIZE_PROGRAM.REVOKE_MESSAGE', 'LOTTERY.DETAILS.PRIZE_PROGRAM.REVOKE_TITTLE')
      .pipe(
        tap(ok => this.showWaitOperationMessage()),
        mergeMap(result => {
          return this.prizeProgramService.revokeLotteryGamePrizeProgram$(this.selectedPrizeProgram._id, true, result.notes);
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
