////////// ANGULAR //////////
import {
  Component,
  OnInit,
  OnDestroy,
  Input
} from '@angular/core';

import {
  FormBuilder,
  FormGroup,
  FormControl,
  Validators,
  FormArray
} from '@angular/forms';

////////// RXJS ///////////
import { map, mergeMap, tap, takeUntil, take } from 'rxjs/operators';
import { Subject, of} from 'rxjs';

//////////// ANGULAR MATERIAL ///////////
import { MatSnackBar } from '@angular/material';

//////////// i18n ////////////
import { TranslateService } from '@ngx-translate/core';
import { locale as english } from '../../i18n/en';
import { locale as spanish } from '../../i18n/es';
import { FuseTranslationLoaderService } from '../../../../../core/services/translation-loader.service';

//////////// Other Services ////////////
import { DrawDetailService } from '../draw-detail.service';

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

  secosPrizes = ['3215987', '3265985', '2569856', '1598965', '5487125', '5698562', '2156986'];
  thoOfThreePrizes = ['3287', '3285', '2856'];
  numberSerieMask = '0000-000';
  prizesResultForm: FormGroup;

  resultsConfirmed = false;



  ///////////////////////////////////////////

  constructor(
    private translationLoader: FuseTranslationLoaderService,
    private translate: TranslateService,
    private formBuilder: FormBuilder,
    public snackBar: MatSnackBar,
    private drawDetailService: DrawDetailService,
  ) {
      this.translationLoader.loadTranslations(english, spanish);
  }


  ngOnInit() {
    this.buildPrizesResultForm();
  }



  buildPrizesResultForm(){

    const grandPrizeResult = (this.selectedDraw.results || {}).grandPrize || '1234234';

    this.prizesResultForm = new FormGroup({
      grandPrize : new FormControl(grandPrizeResult),
      secos: new FormArray([]),
      twoOfThree: new FormArray([])
    });


    this.secosPrizes.forEach((v) => {
      (this. prizesResultForm.get('secos') as FormArray).push(new FormControl(v));
    });

    this.thoOfThreePrizes.forEach((v) => {
      (this. prizesResultForm.get('twoOfThree') as FormArray).push(new FormControl(v));
    });

  }

  confirmResults(){
    const formValue = this.prizesResultForm.getRawValue();

    console.log(formValue);
    const maskConfig = this.numberSerieMask.split('-').map(s => s.length);

    const confirmationTosend = {
      grandPrize: {
        number: formValue.grandPrize.substr(0, maskConfig[0]),
        serie: formValue.grandPrize.substr(maskConfig[0], maskConfig[1]),
      },
      secos: formValue.secos.map(seco => ({
        number: seco.substr(0, maskConfig[0]),
        serie: seco.substr(maskConfig[0], maskConfig[1]),
      })),
      twoOfThree: formValue.twoOfThree
    };

    console.log(confirmationTosend);
  }

  showSnackBar(message) {
    this.snackBar.open(this.translationLoader.getTranslate().instant(message),
      this.translationLoader.getTranslate().instant('SERVICE.CLOSE'), {
        duration: 2000
      });
  }

  ngOnDestroy() {
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
  }

}
