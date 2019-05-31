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
import { DrawCalendarService } from '../draw-calendar.service';

@Component({
  // tslint:disable-next-line:component-selector
  selector: 'game-draw-calendar-metadata',
  templateUrl: './game-draw-calendar-metada.component.html',
  styleUrls: ['./game-draw-calendar-metada.component.scss']
})
// tslint:disable-next-line:class-name
export class GameDrawCalendarMetadataComponent implements OnInit, OnDestroy {
  // Subject to unsubscribe
  private ngUnsubscribe = new Subject();

  gameGeneralInfoForm: any;
  @Input('selectedDrawCalendar') selectedDrawCalendar: any;
  constructor(
    private translationLoader: FuseTranslationLoaderService,
    public snackBar: MatSnackBar,
    private drawCalendarService: DrawCalendarService,
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
    this.drawCalendarService.selectedDrawCalendarChanged$.subscribe(drawCalendar => {
      if (drawCalendar) {
        this.gameGeneralInfoForm.controls['creationDate'].setValue(this.datePipe.transform(drawCalendar.creationTimestamp, 'short'));
        this.gameGeneralInfoForm.controls['creationUsername'].setValue(drawCalendar.creationUsername);
        this.gameGeneralInfoForm.controls['editionDate'].setValue(this.datePipe.transform(drawCalendar.editionTimestamp, 'short'));
        this.gameGeneralInfoForm.controls['editionUsername'].setValue(drawCalendar.editionUsername);
        this.selectedDrawCalendar = drawCalendar;
      }
    });
  }

  ngOnDestroy() {
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
  }

}
