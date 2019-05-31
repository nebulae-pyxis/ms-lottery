////////// ANGULAR //////////
import { Component, OnInit, OnDestroy, Input } from '@angular/core';

////////// RXJS ///////////
import { Subject } from 'rxjs';

//////////// i18n ////////////
import { locale as english } from '../../i18n/en';
import { locale as spanish } from '../../i18n/es';
import { FuseTranslationLoaderService } from '../../../../../core/services/translation-loader.service';

@Component({
  // tslint:disable-next-line: component-selector
  selector: 'pyxis-draw-detail-general-info',
  templateUrl: './general-info.component.html',
  styleUrls: ['./general-info.component.scss']
})
// tslint:disable-next-line:class-name
export class DrawDetailGeneralInfoComponent implements OnInit, OnDestroy {
  // Subject to unsubscribe
  private ngUnsubscribe = new Subject();

  @Input('draw') selectedDraw;

  constructor(private translationLoader: FuseTranslationLoaderService) {
    this.translationLoader.loadTranslations(english, spanish);
  }

  ngOnInit() {
    console.log('ngOnInit', this.selectedDraw);
  }

  ngOnDestroy() {
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
  }
}
