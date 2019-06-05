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
import { QuotaService } from '../quota.service';

@Component({
  // tslint:disable-next-line:component-selector
  selector: 'game-quota-metadata',
  templateUrl: './game-quota-metada.component.html',
  styleUrls: ['./game-quota-metada.component.scss']
})
// tslint:disable-next-line:class-name
export class GameQuotaMetadataComponent implements OnInit, OnDestroy {
  // Subject to unsubscribe
  private ngUnsubscribe = new Subject();

  gameGeneralInfoForm: any;
  @Input('selectedQuota') selectedQuota: any;
  constructor(
    private translationLoader: FuseTranslationLoaderService,
    public snackBar: MatSnackBar,
    private quotaService: QuotaService,
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
    this.quotaService.selectedQuotaChanged$.subscribe(quota => {
      if (quota) {
        this.gameGeneralInfoForm.controls['creationDate'].setValue(this.datePipe.transform(quota.creationTimestamp, 'short'));
        this.gameGeneralInfoForm.controls['creationUsername'].setValue(quota.creationUsername);
        this.gameGeneralInfoForm.controls['editionDate'].setValue(this.datePipe.transform(quota.editionTimestamp, 'short'));
        this.gameGeneralInfoForm.controls['editionUsername'].setValue(quota.editionUsername);
        this.selectedQuota = quota;
      }
    });
  }

  ngOnDestroy() {
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
  }

}
