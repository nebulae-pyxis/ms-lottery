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
  take,
  groupBy,
  reduce,
  pluck,
  delay,
  bufferCount,
  concatMap,
  retryWhen,
  takeWhile,
  mapTo
} from 'rxjs/operators';

import { Subject, fromEvent, of, forkJoin, Observable, concat, combineLatest, iif, from, throwError, range, BehaviorSubject } from 'rxjs';

//////////// ANGULAR MATERIAL ///////////
import {
  MatSnackBar,
  MatDialog,
  MatTableDataSource,
  MatPaginator
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
import { KeycloakService } from 'keycloak-angular';
import { FileUploader } from 'ng2-file-upload';
import { ProgressDialogComponent } from './progress-dialog/progress-dialog.component';

@Component({
  // tslint:disable-next-line:component-selector
  selector: 'game-quota-general-info',
  templateUrl: './game-quota-general-info.component.html',
  styleUrls: ['./game-quota-general-info.component.scss']
})
// tslint:disable-next-line:class-name
export class GameQuotaGeneralInfoComponent implements OnInit, OnDestroy {
  // Subject to unsubscribe
  private ngUnsubscribe = new Subject();
  uploaderChanged = new Subject();
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
  UPLOAD_PACKAGES = 160;

  @Input('game') game: any;
  @Input('selectedQuota') selectedQuota: any;


  public uploader: FileUploader = new FileUploader({ url: '' });
  public uploadingFile = false;
  public hasBaseDropZoneOver = false;


  dataSource = new MatTableDataSource();

  @ViewChild(MatPaginator)
  paginator: MatPaginator;
  tableSize = 0;
  tablePage = 0;
  tableCount = 10;
  tableFromDataDatabase = false;
  // Columns to show in the table
  displayedColumns = [
    'number',
    'series',
  ];
  selectedQuotaNumber;
  userAllowedToUpdateInfo = false;

  lastQuotaReceivedFromSubscriber = new BehaviorSubject(undefined);
  lastQuotaNumberReceivedFromSubscriber = new BehaviorSubject(undefined);

  constructor(
    private translationLoader: FuseTranslationLoaderService,
    private translate: TranslateService,
    public snackBar: MatSnackBar,
    private dialog: MatDialog,
    public quotaService: QuotaService,
    private keycloakService: KeycloakService
  ) {
    this.translationLoader.loadTranslations(english, spanish);
  }


  ngOnInit() {
    this.userAllowedToUpdateInfo = this.keycloakService.getUserRoles(true).some(role => role === 'LOTTERY-ADMIN' || role === 'PLATFORM-ADMIN');
    this.gameGeneralInfoForm = new FormGroup({
      validFromDraw: new FormControl('', [Validators.required]),
      validUntilDraw: new FormControl(''),
    });
    !this.userAllowedToUpdateInfo ? this.gameGeneralInfoForm.disable() : this.gameGeneralInfoForm.enable();
    this.subuscribeToSelectedQuotaChange();
    this.subscribeGameQuotaUpdated();
    this.subscribeToLotteryGameQuotaNumberUpdated();
    this.subscribeToUploaderChange();
    this.paginator.page.pipe(
      mergeMap(page => {
        return iif(() => this.tableFromDataDatabase,
          this.quotaService.lotteryGameQuotaNumberList$({ quotaId: this.selectedQuota._id }, page.pageIndex, page.pageSize).pipe(
            map(result => result.data.LotteryGameQuotaNumberList),
            tap(quotaNumberList => {
              this.dataSource.data = quotaNumberList;
            })
          ),
          this.refreshTable$(this.quotaService.fileQuotaList, page.pageIndex, page.pageSize));
      })
    ).subscribe();
  }

  selectQuotaNumberRow(row) {
    this.selectedQuotaNumber = row;
  }

  subscribeToUploaderChange() {
    this.uploaderChanged.pipe(
      takeUntil(this.ngUnsubscribe),
      tap(() => { this.uploadingFile = true; }),
      mergeMap(blob => {
        return this.readFile(blob);
      }),
      mergeMap((fileText: any) => this.convertFileToObject$(fileText)),
      tap(result => {
        this.uploadingFile = false;
        this.hasBaseDropZoneOver = false;
        this.tableFromDataDatabase = false;
        this.quotaService.fileQuotaList = result;
        this.tableSize = result.length;
      }),
      mergeMap(result => this.refreshTable$(result, this.tablePage, this.tableCount))
    ).subscribe(val => {
    }
    );
  }

  refreshTable$(listToSlice, tablePage, tableCount) {
    return of(listToSlice).pipe(
      map(quotaList => quotaList.slice(tablePage * tableCount, (tablePage * tableCount) + tableCount)),
      tap(subList => {
        this.dataSource.data = subList;
      })
    );
  }


  public fileOverBase(e: any): void {

    this.hasBaseDropZoneOver = e;
  }

  fileDroped(e) {
    this.uploaderChanged.next(this.uploader.queue[0].file.rawFile);
  }

  fileUpload(event) {
    this.uploaderChanged.next(event.srcElement.files[0]);
  }

  clearSelectedFile() {
    this.dataSource.data = [];
    this.quotaService.fileQuotaList = [];
    this.tableSize = 0;
  }

  convertFileToObject$(readerResult) {
    return from(readerResult.split(/\r\n|\r|\n/g)).pipe(
      map((file: any) => file.split(',')),
      filter(lineList => lineList && lineList[0] !== ''),
      tap(lineList => {
        if (lineList.length !== 3) {
          throw new Error('Failed converting the line');
        }
      }),
      map(([_, number, serie]) => ({ number, serie })),
      groupBy(quotaNumber => quotaNumber.number),
      mergeMap(group => group.pipe(
        pluck('serie'),
        toArray(),
        map(series => ({ number: group.key, series }))
      )),
      toArray()
    );
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
    return roles && roles.length > 0;
  }

  subuscribeToSelectedQuotaChange() {
    this.quotaService.selectedQuotaChanged$.pipe(
      tap(quota => {
        if (quota) {
          this.showSaveButton = !quota.approved || quota.approved === 'NOT_APPROVED';
          this.showDuplicateButton = quota.approved === 'APPROVED';
          this.gameGeneralInfoForm.controls['validFromDraw'].setValue(quota.validFromDraw);
          this.gameGeneralInfoForm.controls['validUntilDraw'].setValue(quota.validUntilDraw);
        } else {
          this.gameGeneralInfoForm.controls['validFromDraw'].setValue('');
          this.gameGeneralInfoForm.controls['validUntilDraw'].setValue('');
          this.showSaveButton = true;
          this.showDuplicateButton = false;
        }
        this.selectedQuota = quota;
      }),
      filter(quota => quota !== undefined),
      mergeMap((quota: any) => this.quotaService.lotteryGameQuotaNumberListSize$({ quotaId: quota._id })),
      filter(result => result.data !== undefined),
      map(result => result.data.LotteryGameQuotaNumberListSize),
      filter((tableSize: any) => tableSize !== undefined && (tableSize > 0)),
      tap(tableSize => {
        this.tableSize = tableSize;
      }),
      mergeMap(() => this.quotaService.lotteryGameQuotaNumberList$({ quotaId: this.selectedQuota._id }, this.tablePage, this.tableCount)),
      map(result => result.data.LotteryGameQuotaNumberList)
    ).subscribe(quotaNumberList => {
      this.tableFromDataDatabase = true;
      this.dataSource.data = quotaNumberList;
    });
  }
  subscribeGameQuotaUpdated() {
    this.quotaService.subscribeLotteryGameQuotaUpdatedSubscription$()
      .pipe(
        map(subscription => subscription.data.LotteryGameQuotaUpdatedSubscription),
        takeUntil(this.ngUnsubscribe)
      )
      .subscribe((game: any) => {
        // this.showSnackBar('LOTTERY.DETAILS.CONFIG_SHEET.OPERATION_COMPLETED');
        console.log('llega sub de backEnd');
        this.lastQuotaReceivedFromSubscriber.next(game);
        clearTimeout(this.timeoutMessage);
      });
  }

  subscribeToLotteryGameQuotaNumberUpdated() {
    this.quotaService.subscribeLotteryGameQuotaNumberUpdatedSubscription$()
      .pipe(
        map(subscription => subscription.data.LotteryGameQuotaNumberUpdatedSubscription),
        tap(result => {
          this.lastQuotaNumberReceivedFromSubscriber.next(result);
        }),
        takeUntil(this.ngUnsubscribe)
      )
      .subscribe((game: any) => {
      });
  }

  openProgressDialog() {
    return this.dialog
      // Opens confirm dialog
      .open(ProgressDialogComponent, {
        data: {
          dialogTitle: 'LOTTERY.DETAILS.QUOTA.UPLOADING_TITTLE',
        },
        disableClose: true
      })
      .afterOpen();
  }

  createQuota() {
    const message = this.selectedQuota !== undefined && this.selectedQuota.approved === 'NOT_APPROVED' ? 'LOTTERY.DETAILS.QUOTA.SAVE_MESSAGE' : 'LOTTERY.DETAILS.QUOTA.SAVE_MESSAGE';
    const tittle = this.selectedQuota !== undefined && this.selectedQuota.approved === 'NOT_APPROVED' ? 'LOTTERY.UPDATE_TITLE' : 'LOTTERY.CREATE_TITLE';
    this.showConfirmationDialog$(message, tittle).pipe(
      // Build the quta using the info located in the form
      mapTo(this.buildQuotaObject()),
      // Decides if the operation is an update or a creation of the quota
      mergeMap(quota => {
        return iif(() => (this.selectedQuota !== undefined && this.selectedQuota.approved === 'NOT_APPROVED')
          , this.quotaService.updateLotteryGameQuota$(this.selectedQuota !== undefined ? this.selectedQuota._id : '', quota)
          , this.quotaService.createLotteryGameQuota$(quota)).pipe(
            tap(response => {
              if (response.errors) {
                throw new Error('Failed to persist the quota' + quota);
              }
            }),
          );
      }),
      take(1),
      mergeMap(() => this.tableFromDataDatabase ? of(undefined) : this.sendFileInfoToTheServer$())
    ).subscribe(result => {
    },
      error => {
        // restart all varivales (send currentUploadProgress to 100 to close the dialog and to 0 to restart the percentaje)
        this.quotaService.currentUploadProgress$.next(100);
        this.quotaService.currentUploadProgress$.next(0);
        this.lastQuotaReceivedFromSubscriber.next(undefined);
        this.lastQuotaNumberReceivedFromSubscriber.next(undefined);
        this.showErrorOperationMessage();
      },
      () => {
        console.log('retorna en el complete');
        // restart all variables
        this.quotaService.currentUploadProgress$.next(0);
        this.lastQuotaReceivedFromSubscriber.next(undefined);
        this.lastQuotaNumberReceivedFromSubscriber.next(undefined);
      });
  }

  sendFileInfoToTheServer$() {
    console.log('entra a subir el archivo: ', this.tableFromDataDatabase);
    const initOperationTime = new Date().getTime();
    // if the quota has been persisted succeful open the progressDialog
    return this.openProgressDialog().pipe(
      // start listening the quota subscriber to get the quota persisted (with a timeout of 5 second)
      mergeMap(() => {
        return this.lastQuotaReceivedFromSubscriber.pipe(
          map(val => {
            if (val === undefined) {
              throw val;
            }
            return val;
          }),
          retryWhen(errors =>
            errors.pipe(
              tap(() => {
                if ((initOperationTime + 5000) < new Date().getTime()) {
                  throw new Error('Failed updating the quota');
                }
              }),
              delay(500)
            )
          ),
          take(1),
          // when the quota persisted is received start the process of clean the quota numbers of the quota
          mergeMap(lastQuota => {
            this.selectedQuota = lastQuota;
            return this.quotaService.removeLotteryGameQuotaNumber$(lastQuota._id).pipe(
              tap(response => {
                if (response.errors) {
                  throw new Error('Failed to remove the quota numbers asociated to the quota' + this.selectedQuota._id);
                }
              })
            );
          }),
        );
      }),
      // start listening the quota number subscriber to get the quota number has been succeful removed (with a timeout of 5 second)
      mergeMap(response => {
        const initOperationQuotaNumberTime = new Date().getTime();
        return this.lastQuotaNumberReceivedFromSubscriber.pipe(
          map(val => {
            if (val === undefined) {
              throw val;
            }
            return val.action;
          }),
          retryWhen(errors =>
            errors.pipe(
              tap(() => {
                if ((initOperationQuotaNumberTime + 5000) < new Date().getTime()) {
                  throw new Error('Failed updating the quota');
                }
              }),
              delay(500)
            )
          ),
          take(1)
        );
      }),
      // get only the quota number remove actions
      filter(action => action === 'REMOVE'),
      // start the send file data to the backend
      mergeMap(() => {
        let count = 1;
        return from(this.quotaService.fileQuotaList).pipe(
          bufferCount(this.UPLOAD_PACKAGES),
          concatMap(quotaNumberPackage => {
            return this.quotaService.createLotteryGameQuotaNumber$(quotaNumberPackage,
              this.game.generalInfo.lotteryId,
              this.game._id,
              this.selectedQuota._id
            ).pipe(
              // verify the response and increment the succeful percentaje
              map(response => {
                if (response.errors) {
                  throw new Error('Failed to persist the quota number' + quotaNumberPackage);
                } else {
                  const percentaje = ((this.UPLOAD_PACKAGES * count) * 100) / this.tableSize;
                  count++;
                  const percentajeFixed = parseInt(percentaje.toFixed(0));
                  this.quotaService.currentUploadProgress$.next(percentajeFixed);
                  return percentajeFixed;
                }
              }),
              delay(500),
            );
          }),
          toArray()
        );
      }),
      // Update the quota state to PENDING
      mergeMap(() => {
        return this.quotaService.updateLotteryGameQuota$(this.selectedQuota._id, this.buildQuotaObject()).pipe(
          tap(response => {
            if (response.errors) {
              throw new Error('Failed to persist the quota' + response);
            } else {
              this.showSnackBar('LOTTERY.DETAILS.CONFIG_SHEET.OPERATION_COMPLETED');
            }
          }),
        );
      })
    );
  }

  buildQuotaObject() {
    return {
      validFromDraw: parseInt(this.gameGeneralInfoForm.getRawValue().validFromDraw),
      validUntilDraw: parseInt(this.gameGeneralInfoForm.getRawValue().validUntilDraw),
      gameId: this.game._id,
      lotteryId: this.game.generalInfo.lotteryId,
      approved: 'PENDING'
    };
  }

  duplicateSelected() {
    const currentQuota = this.quotaService.selectedQuotaChanged$.getValue();
    this.quotaService.selectedQuotaChanged$.next({
      validFromDraw: currentQuota.validFromDraw,
      validUntilDraw: currentQuota.validUntilDraw,
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


  readFile = (blob) => Observable.create(obs => {
    if (!(blob instanceof Blob)) {
      obs.error(new Error('`blob` must be an instance of File or Blob.'));
      return;
    }

    const reader = new FileReader();

    reader.onerror = err => obs.error(err);
    reader.onabort = err => obs.error(err);
    reader.onload = () => obs.next(reader.result);
    reader.onloadend = () => obs.complete();

    return reader.readAsText(blob);
  })



  ngOnDestroy() {
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
  }

}
