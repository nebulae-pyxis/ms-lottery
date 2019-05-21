////////// ANGULAR //////////
import {
  Component,
  OnInit,
  OnDestroy,
  Input
} from '@angular/core';

import {
  FormGroup,
  FormControl
} from '@angular/forms';

import { Subject, fromEvent, of, forkJoin, Observable, concat, combineLatest, iif } from 'rxjs';

import { DatePipe } from '@angular/common';

//////////// ANGULAR MATERIAL ///////////
import {
  MatSnackBar,
} from '@angular/material';

import { locale as english } from '../../../i18n/en';
import { locale as spanish } from '../../../i18n/es';
import { FuseTranslationLoaderService } from '../../../../../../core/services/translation-loader.service';

//////////// Others ////////////
import { DialogComponent } from '../../../dialog/dialog.component';
import { GameDetailService } from '../../game-detail.service';

@Component({
  // tslint:disable-next-line:component-selector
  selector: 'game-sheet-config-metadata',
  templateUrl: './game-sheet-config-metada.component.html',
  styleUrls: ['./game-sheet-config-metada.component.scss']
})
// tslint:disable-next-line:class-name
export class GameSheetConfigMetadataComponent implements OnInit, OnDestroy {
  // Subject to unsubscribe
  private ngUnsubscribe = new Subject();

  gameGeneralInfoForm: any;
  @Input('selectedConfigSheet') selectedConfigSheet: any;
  constructor(
    private translationLoader: FuseTranslationLoaderService,
    public snackBar: MatSnackBar,
    private gameDetailService: GameDetailService,
    private datePipe: DatePipe
  ) {
    this.translationLoader.loadTranslations(english, spanish);
  }


  ngOnInit() {
    this.initForm();
    this.subscribeToSelectedVersion();
  }

  initForm() {
    this.gameGeneralInfoForm = new FormGroup({
      creationDate: new FormControl(''),
      creationUsername: new FormControl(''),
      editionDate: new FormControl(''),
      editionUsername: new FormControl(''),
    });
  }

  subscribeToSelectedVersion() {
    this.gameDetailService.selectedConfigSheetChanged$.subscribe(configSheet => {
      if (configSheet) {
        this.gameGeneralInfoForm.controls['creationDate'].setValue(this.datePipe.transform(configSheet.creationTimestamp, 'short'));
        this.gameGeneralInfoForm.controls['creationUsername'].setValue(configSheet.creationUsername);
        this.gameGeneralInfoForm.controls['editionDate'].setValue(this.datePipe.transform(configSheet.editionTimestamp, 'short'));
        this.gameGeneralInfoForm.controls['editionUsername'].setValue(configSheet.editionUsername);
        this.selectedConfigSheet = configSheet;
      }
    });
  }

  ngOnDestroy() {
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
  }

}
