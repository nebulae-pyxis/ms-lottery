////////// ANGULAR //////////
import { Component, OnInit, OnDestroy, Input, Output, EventEmitter } from '@angular/core';

import {
  FormGroup,
  FormControl,
  FormArray
} from '@angular/forms';

////////// RXJS ///////////
import { Subject } from 'rxjs';

//////////// ANGULAR MATERIAL ///////////
import { MatSnackBar, MatDialog } from '@angular/material';

//////////// i18n ////////////
import { locale as english } from '../../i18n/en';
import { locale as spanish } from '../../i18n/es';
import { FuseTranslationLoaderService } from '../../../../../core/services/translation-loader.service';
import { DrawDetailService } from '../draw-detail.service';
import { tap, filter, mergeMap } from 'rxjs/operators';
import { ConfirmationDialogComponent } from '../../dialog/dialog.component';


@Component({
  // tslint:disable-next-line: component-selector
  selector: 'pyxis-draw-detail-results',
  templateUrl: './results.component.html',
  styleUrls: ['./results.component.scss']
})
// tslint:disable-next-line:class-name
export class DrawDetailResultsComponent implements OnInit, OnDestroy {
  // Subject to unsubscribe
  private ngUnsubscribe = new Subject();

  @Input('draw') selectedDraw: any;

  secosPrizes = [
    { number: '1254', series: '256' },
    { number: '1254', series: '256' },
    { number: '1254', series: '256' },
    { number: '1254', series: '256' },
    { number: '1254', series: '256' },
    { number: '1254', series: '256' },
    { number: '1254', series: '256' }
  ];
  thoOfThreePrizes = [
    { number: '1254' },
    { number: '1254' },
    { number: '1254' }
  ];
  numberSerieMask = '0000-000';
  prizesResultForm: FormGroup;

  isResultsEditable = false;
  confirmButtonDisabled = false;

  ///////////////////////////////////////////

  constructor(
    private translationLoader: FuseTranslationLoaderService,
    public snackBar: MatSnackBar,
    private drawDetailService: DrawDetailService,
    private dialog: MatDialog
  ) {
    this.translationLoader.loadTranslations(english, spanish);
  }

  ngOnInit() {
    this.buildPrizesResultForm();
  }

  buildPrizesResultForm() {
    const grandPrizeResult =
      (this.selectedDraw.results || {}).grandPrize || '1234234';

    this.prizesResultForm = new FormGroup({
      grandPrize: new FormControl(grandPrizeResult),
      secos: new FormArray([]),
      twoOfThree: new FormArray([])
    });

    this.secosPrizes.forEach(v => {
      (this.prizesResultForm.get('secos') as FormArray).push(
        new FormControl(`${v.number}${v.series}`)
      );
    });

    this.thoOfThreePrizes.forEach(v => {
      (this.prizesResultForm.get('twoOfThree') as FormArray).push(
        new FormControl(`${v.number}`)
      );
    });
  }

  confirmResults() {
    const formValue = this.prizesResultForm.getRawValue();
    const maskConfig = this.numberSerieMask.split('-').map(s => s.length);
    const confirmationTosend = {
      grandPrize: {
        number: formValue.grandPrize.substr(0, maskConfig[0]),
        serie: formValue.grandPrize.substr(maskConfig[0], maskConfig[1])
      },
      secos: formValue.secos.map(seco => ({
        number: seco.substr(0, maskConfig[0]),
        serie: seco.substr(maskConfig[0], maskConfig[1])
      })),
      twoOfThree: formValue.twoOfThree
    };



    this.showConfirmationDialog$(
      'DRAW_ACCORDION.RESULTS_PANEL.CONFIRM_RESULTS_TITLE',
      'DRAW_ACCORDION.RESULTS_PANEL.CONFIRM_RESULTS_MESSAGE')
    .pipe(
      tap(() => this.confirmButtonDisabled = true ),
      mergeMap(() => this.drawDetailService.confirmResults$(this.selectedDraw.id, confirmationTosend)),
      tap(r => {
        this.confirmButtonDisabled = false;
        if (r.code === 200){
          this.isResultsEditable = true;
          this.showSnackBar('DRAW_ACCORDION.RESULTS_PANEL.RESULTS_CONFIRMED_SUCCESSFUL');
        }

      })
    )
    .subscribe();


  }

  showSnackBar(message, duration?, action?) {
    this.snackBar.open(
      this.translationLoader.getTranslate().instant(message),
      action ? this.translationLoader.getTranslate().instant('CLOSE_SNACK_BAR') : '',
      { duration : duration || 3000 }
    );
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

  ngOnDestroy() {
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
  }
}
