////////// ANGULAR //////////
import { Component, OnInit, OnDestroy, NgZone, ViewChild, Input } from '@angular/core';
////////// RXJS ///////////
import { take, takeUntil, filter, mergeMap, tap } from 'rxjs/operators';
import { Subject, of } from 'rxjs';
//////////// ANGULAR MATERIAL ///////////
import { MatSnackBar, MatDialog } from '@angular/material';
//////////// i18n ////////////
import { locale as english } from '../../i18n/en';
import { locale as spanish } from '../../i18n/es';
import { FuseTranslationLoaderService } from '../../../../../core/services/translation-loader.service';
//////////// Other Services ////////////
import { DrawDetailService } from '../draw-detail.service';
import { CdkTextareaAutosize } from '@angular/cdk/text-field';
import { ConfirmationDialogComponent } from '../../dialog/dialog.component';
import { FormControl } from '@angular/forms';

@Component({
  // tslint:disable-next-line: component-selector
  selector: 'pyxis-draw-detail-approvement',
  templateUrl: './approvement.component.html',
  styleUrls: ['./approvement.component.scss']
})
export class DrawDetailApprovementComponent implements OnInit, OnDestroy {
  @Input('draw') selectedDraw;
  private ngUnsubscribe = new Subject();
  notes = new FormControl('');

  @ViewChild('autosize') autosize: CdkTextareaAutosize;

  constructor(
    private translationLoader: FuseTranslationLoaderService,
    public snackBar: MatSnackBar,
    private ngZone: NgZone,
    private drawDetailService: DrawDetailService,
    private dialog: MatDialog
  ) {
    this.translationLoader.loadTranslations(english, spanish);
  }

  ngOnInit() {
    console.log('drawId => ', this.selectedDraw.id);
  }

  approveResults(approve) {
    of(this.notes.value.trim())
      .pipe(
        mergeMap(notes =>
          !approve && notes.length < 50
            ? of(false).pipe(tap(() => this.showSnackBar('DRAW_ACCORDION.APPROVEMENT_PANEL.NOTES_REQUIRED', 7000)))
            : this.showConfirmationDialog$(
                `DRAW_ACCORDION.APPROVEMENT_PANEL.${approve ? 'APPROVE' : 'REJECT'}_RESULTS_TITLE`,
                `DRAW_ACCORDION.APPROVEMENT_PANEL.${approve ? 'APPROVE' : 'REJECT'}_RESULTS_MESSAGE`
              )
        ),
        filter(r => r),
        mergeMap(() => this.drawDetailService.approveResults$(this.selectedDraw.id, approve, this.notes.value.trim() )),
        tap(r => console.log('Resultado ==> ', r))


      )
      .subscribe();
  }

  showConfirmationDialog$(dialogTitle, dialogMessage) {
    return this.dialog
      .open(ConfirmationDialogComponent, {
        data: {
          dialogMessage,
          dialogTitle
        }
      })
      .afterClosed()
      .pipe(filter(okButton => okButton));
  }

  triggerResize() {
    this.ngZone.onStable
      .pipe(
        take(1),
        takeUntil(this.ngUnsubscribe)
      )
      .subscribe(() => this.autosize.resizeToFitContent(true));
  }

  /**
   * Show extracted message using the i18n key given as parameter
   * @param message i18n key
   * @param duration message duration in millis
   */
  showSnackBar(message, duration?) {
    this.snackBar.open(
      this.translationLoader.getTranslate().instant(message),
      this.translationLoader.getTranslate().instant('CLOSE_SNACK_BAR'),
      {
        duration: duration || 3000
      }
    );
  }

  ngOnDestroy() {
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
  }
}
