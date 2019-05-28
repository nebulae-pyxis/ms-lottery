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
import { PrizeProgramService } from '../prize-program.service';

@Component({
  // tslint:disable-next-line:component-selector
  selector: 'game-prize-program-metadata',
  templateUrl: './game-prize-program-metada.component.html',
  styleUrls: ['./game-prize-program-metada.component.scss']
})
// tslint:disable-next-line:class-name
export class GamePrizeProgramMetadataComponent implements OnInit, OnDestroy {
  // Subject to unsubscribe
  private ngUnsubscribe = new Subject();

  gameGeneralInfoForm: any;
  @Input('selectedPrizeProgram') selectedPrizeProgram: any;
  constructor(
    private translationLoader: FuseTranslationLoaderService,
    public snackBar: MatSnackBar,
    private prizeProgramService: PrizeProgramService,
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
    this.prizeProgramService.selectedPrizeProgramChanged$.subscribe(prizeProgram => {
      if (prizeProgram) {
        this.gameGeneralInfoForm.controls['creationDate'].setValue(this.datePipe.transform(prizeProgram.creationTimestamp, 'short'));
        this.gameGeneralInfoForm.controls['creationUsername'].setValue(prizeProgram.creationUsername);
        this.gameGeneralInfoForm.controls['editionDate'].setValue(this.datePipe.transform(prizeProgram.editionTimestamp, 'short'));
        this.gameGeneralInfoForm.controls['editionUsername'].setValue(prizeProgram.editionUsername);
        this.selectedPrizeProgram = prizeProgram;
      }
    });
  }

  ngOnDestroy() {
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
  }

}
