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
  take,
  reduce
} from 'rxjs/operators';

import { Subject, fromEvent, of, forkJoin, Observable, concat, combineLatest, iif, from } from 'rxjs';

//////////// ANGULAR MATERIAL ///////////
import {
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
import { GameDetailService } from '../game-detail.service';
import { DialogComponent } from '../../dialog/dialog.component';
import { ToolbarService } from '../../../../toolbar/toolbar.service';
import { Location } from '@angular/common';

@Component({
  // tslint:disable-next-line:component-selector
  selector: 'game-general-info',
  templateUrl: './game-general-info.component.html',
  styleUrls: ['./game-general-info.component.scss']
})
// tslint:disable-next-line:class-name
export class GameDetailGeneralInfoComponent implements OnInit, OnDestroy {
  // Subject to unsubscribe
  private ngUnsubscribe = new Subject();

  @Input('pageType') pageType: string;
  @Input('game') game: any;

  gameGeneralInfoForm: any;
  gameStateForm: any;
  lotteryId;
  // Stream of filtered client by auto-complete text
  queriedLotteriesByAutocomplete$: Observable<any[]>;
  lotteryName = 'test';
  timeoutMessage = null;
  selectedType = 'ORDINARY';
  userAllowedToUpdateInfo = false;

  constructor(
    private translationLoader: FuseTranslationLoaderService,
    private translate: TranslateService,
    private formBuilder: FormBuilder,
    public snackBar: MatSnackBar,
    private router: Router,
    private activatedRouter: ActivatedRoute,
    private GameDetailService: GameDetailService,
    private dialog: MatDialog,
    private toolbarService: ToolbarService,
    private location: Location,
    private route: ActivatedRoute,
    private keycloakService: KeycloakService
  ) {
    this.translationLoader.loadTranslations(english, spanish);
  }


  ngOnInit() {
    if (this.game && this.game.generalInfo) {
      this.selectedType = this.game.generalInfo.type;
    }
    this.userAllowedToUpdateInfo = this.keycloakService.getUserRoles(true).some(role => role === 'LOTTERY-ADMIN' || role === 'PLATFORM-ADMIN');
    this.subscribeEventUpdated();
    this.buildForms();
    this.buildLotteryNameFilterCtrl();
  }

  updateGameRoute(requiredParams: [string], newSegment: string) {
    this.route.params
      .pipe(
        mergeMap(params => {
          return from(requiredParams).pipe(
            reduce((acc, val) => {
              return acc + '/' + params[val];
             }, 'game')
          );
         })
    )
      .subscribe((url: any) => {
        this.location.replaceState(url + '/' + newSegment);
    }, e => console.log(e));

  }

  buildForms() {
    this.gameGeneralInfoForm = new FormGroup({
      name: new FormControl(this.game ? (this.game.generalInfo || {}).name : '', Validators.required),
      description: new FormControl(this.game ? (this.game.generalInfo || {}).description : ''),
      gameLottery: new FormControl('', Validators.required),
    });

    this.gameStateForm = new FormGroup({
      state: new FormControl(this.game ? this.game.state : true)
    });
    !this.userAllowedToUpdateInfo ? this.gameGeneralInfoForm.disable() : this.gameGeneralInfoForm.enable();
    !this.userAllowedToUpdateInfo ? this.gameStateForm.disable() : this.gameStateForm.enable();
  }

  checkLottery() {
    if (!this.lotteryId) {
      this.gameGeneralInfoForm.controls['gameLottery'].setValue(null);
    }
  }

  buildLotteryNameFilterCtrl() {
    this.queriedLotteriesByAutocomplete$ = this.gameGeneralInfoForm.get('gameLottery').valueChanges.pipe(
      debounceTime(200),
      distinctUntilChanged(),
      tap((selected) => {
        if (typeof selected === 'string' || selected instanceof String) {
          this.gameGeneralInfoForm.patchValue({ operator: null });
        }
      }),
      filter(text => (typeof text === 'string' || text instanceof String)),
      mergeMap((x: any) => iif(() => !x, of([]), this.getAllLotteriesFiltered$(x, 3)))
    );
    this.lotteryName = 'value';
    if (this.game && this.game.generalInfo && this.game.generalInfo.lotteryId) {
      this.GameDetailService.getLotteryLottery$(this.game.generalInfo.lotteryId).subscribe(result => {
        if (result.data && result.data.LotteryLottery && result.data.LotteryLottery.generalInfo) {
          this.gameGeneralInfoForm.controls['gameLottery'].setValue(result.data.LotteryLottery);
        }
      });
    }
  }



  getAllLotteriesFiltered$(filterText: String, limit: number): Observable<any[]> {
    const paginationInput = {
      page: 0,
      count: limit,
      sort: -1
    };
    return this.GameDetailService
      .LotteriesFilterInput$(filterText, paginationInput)
      .pipe(
        map(lotteries => {
          return [...lotteries.data.LotteryLotteries];
        }),
      );
  }




  subscribeEventUpdated() {
    this.GameDetailService.notifyLotteryGameUpdated$
      .pipe(
        takeUntil(this.ngUnsubscribe)
      )
      .subscribe(data => {
        if (this.timeoutMessage) {
          clearTimeout(this.timeoutMessage);
        }
      });
  }

  createGame() {
      this.showConfirmationDialog$('LOTTERY.CREATE_MESSAGE', 'LOTTERY.CREATE_TITLE')
      .pipe(
        tap(ok => this.showWaitOperationMessage()),
        mergeMap(ok => {
          console.log('Form: ', this.gameGeneralInfoForm.getRawValue());
          this.game = {
            generalInfo: {
              name: this.gameGeneralInfoForm.getRawValue().name.toUpperCase(),
              lotteryId: this.lotteryId,
              type: this.selectedType,
              description: this.gameGeneralInfoForm.getRawValue().description
            },
            state: this.gameStateForm.getRawValue().state,
          };
          return this.GameDetailService.createLotteryGame$(this.game);
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

  updateGameGeneralInfo() {
    this.showConfirmationDialog$('LOTTERY.UPDATE_MESSAGE', 'LOTTERY.UPDATE_TITLE')
      .pipe(
        tap(ok => this.showWaitOperationMessage()),
        mergeMap(ok => {
          const generalInfoinput = {
            name: this.gameGeneralInfoForm.getRawValue().name.toUpperCase(),
            description: this.gameGeneralInfoForm.getRawValue().description,
            lotteryId: this.lotteryId,
            type: this.selectedType
          };
          return this.GameDetailService.updateLotteryGameGeneralInfo$(this.game._id, generalInfoinput);
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

  onLotterySelected(lottery) {
    console.log('se ejecuta on option Selected: ', lottery);
    this.gameGeneralInfoForm.patchValue({ lottery });
    if (lottery) {
      this.lotteryId = lottery._id;
    }
  }

  lotteryDisplayFn(lottery) {
    if (lottery && lottery.generalInfo) {
      return (lottery && lottery.generalInfo) ? lottery.generalInfo.name : '';
    }
  }

  onGameStateChange() {
    this.showConfirmationDialog$('LOTTERY.UPDATE_MESSAGE', 'LOTTERY.UPDATE_TITLE')
      .pipe(
        tap(ok => this.showWaitOperationMessage()),
        mergeMap(ok => {
          return this.GameDetailService.updateLotteryGameState$(this.game._id, this.gameStateForm.getRawValue().state);
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
