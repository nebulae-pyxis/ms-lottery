////////// ANGULAR //////////
import {
  Component,
  OnInit,
  OnDestroy,
  Input,
} from '@angular/core';

import {
  FormGroup,
  FormControl,
  Validators
} from '@angular/forms';


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
  take
} from 'rxjs/operators';

import { Subject, fromEvent, of, forkJoin, Observable, concat, combineLatest, iif } from 'rxjs';

//////////// ANGULAR MATERIAL ///////////
import {
  MatSnackBar,
  MatDialog
} from '@angular/material';

//////////// i18n ////////////

import { locale as english } from '../../../../i18n/en';
import { locale as spanish } from '../../../../i18n/es';
import { FuseTranslationLoaderService } from '../../../../../../../core/services/translation-loader.service';

import { DrawCalendarService } from '../../draw-calendar.service';

import {
  DateAdapter,
  MAT_DATE_FORMATS,
  MAT_DATE_LOCALE,
  MomentDateAdapter
} from '@coachcare/datepicker';
import * as moment from 'moment';
import { MAT_MOMENT_DATE_FORMATS } from '../../my-date-format';
import { KeycloakService } from 'keycloak-angular';


@Component({
  // tslint:disable-next-line:component-selector
  selector: 'draw-calendar-template',
  templateUrl: './draw-calendar-template.component.html',
  styleUrls: ['./draw-calendar-template.component.scss'],
  providers: [
    { provide: MAT_DATE_LOCALE, useValue: 'es' },
    {
      provide: DateAdapter,
      useClass: MomentDateAdapter,
      deps: [MAT_DATE_LOCALE]
    },
    { provide: MAT_DATE_FORMATS, useValue: MAT_MOMENT_DATE_FORMATS }
  ]
})
// tslint:disable-next-line:class-name
export class DrawCalendarTemplateComponent implements OnInit, OnDestroy {
  // Subject to unsubscribe
  private ngUnsubscribe = new Subject();

  templateForm: any;
  // Stream of filtered client by auto-complete text
  queriedLotteriesByAutocomplete$: Observable<any[]>;
  templateChanged = new Subject();
  userAllowedToUpdateInfo = false;

  constructor(
    private translationLoader: FuseTranslationLoaderService,
    public snackBar: MatSnackBar,
    private drawCalendarService: DrawCalendarService,
    private keycloakService: KeycloakService
  ) {
    this.translationLoader.loadTranslations(english, spanish);
  }


  ngOnInit() {
    this.userAllowedToUpdateInfo = this.keycloakService.getUserRoles(true).some(role => role === 'LOTTERY-ADMIN' || role === 'PLATFORM-ADMIN');
    this.buildForm();
    this.subuscribeToSelectedDrawCalendarChange();
    this.listenFormaChanges();
  }

  buildForm() {
    this.templateForm = new FormGroup({
      openDrawDaysBefore: new FormControl('', [Validators.required]),
      openDrawTime: new FormControl('', [Validators.required]),
      closeDrawMinutesBefore: new FormControl('', [Validators.required]),
      deactivateDrawMonthsAfter: new FormControl('', [Validators.required]),
      deactivateDrawtime: new FormControl('', [Validators.required]),
      validFromTimestamp: new FormControl('', [Validators.required]),
      validUntilTimestamp: new FormControl('', [Validators.required])
    });
    !this.userAllowedToUpdateInfo ? this.templateForm.disable() : this.templateForm.enable();
  }

  numberOnly(event): boolean {
    const charCode = (event.which) ? event.which : event.keyCode;
    if (charCode > 31 && (charCode < 48 || charCode > 57)) {
      return false;
    }
    return true;
  }

  listenFormaChanges() {
    this.templateChanged.pipe(
      debounceTime(500)
    ).subscribe(template => {
      console.log('se envia nuevo form: ', !this.templateForm.invalid);
      this.drawCalendarService.templateFormValid$.next(!this.templateForm.invalid);
    });
  }

  validFromTimestampChanged(event) {
    if (this.templateForm.controls['validFromTimestamp'].value) {
      this.drawCalendarService.validFromTimestamp = this.templateForm.controls['validFromTimestamp'].value.valueOf();
      this.templateChanged.next(undefined);
    }
  }

  validUntilTimestampChanged(event) {
    if (this.templateForm.controls['validUntilTimestamp'].value) {
      this.drawCalendarService.validUntilTimestamp = this.templateForm.controls['validUntilTimestamp'].value.valueOf();
    this.templateChanged.next(undefined);
    }
  }

  openDrawDaysBeforeChanged(event) {
    const template = !this.drawCalendarService.template ? {} : this.drawCalendarService.template;
    template.openDrawDaysBefore = parseInt(event);
    this.drawCalendarService.template = template;
    this.templateChanged.next(template);
  }

  openDrawTimeChanged(event) {
    if (this.templateForm.controls['openDrawTime'].value) {
      const template = !this.drawCalendarService.template ? {} : this.drawCalendarService.template;
      template.openDrawTime = this.templateForm.controls['openDrawTime'].value.format('HH:mm');
      this.drawCalendarService.template = template;
      this.templateChanged.next(template);
    }
  }

  closeDrawMinutesBeforeChanged(event) {
    const template = !this.drawCalendarService.template ? {} : this.drawCalendarService.template;
    template.closeDrawMinutesBefore = parseInt(event);
    this.drawCalendarService.template = template;
    this.templateChanged.next(template);
  }

  deactivateDrawMonthsAfterChanged(event) {
    const template = !this.drawCalendarService.template ? {} : this.drawCalendarService.template;
    template.deactivateDrawMonthsAfter = parseInt(event);
    this.drawCalendarService.template = template;
    this.templateChanged.next(template);
  }

  deactivateDrawtimeChanged(event) {
    if (this.templateForm.controls['deactivateDrawtime'].value) {
      const template = !this.drawCalendarService.template ? {} : this.drawCalendarService.template;
      template.deactivateDrawtime = this.templateForm.controls['deactivateDrawtime'].value.format('HH:mm');
      this.drawCalendarService.template = template;
      this.templateChanged.next(template);
    }
  }

  subuscribeToSelectedDrawCalendarChange() {
    this.drawCalendarService.selectedDrawCalendarChanged$.pipe(
      debounceTime(300)
    ).subscribe(drawCalendar => {
      if (drawCalendar && drawCalendar.template) {
        this.templateForm.controls['openDrawDaysBefore'].setValue(drawCalendar.template.openDrawDaysBefore);
        this.templateForm.controls['openDrawTime'].setValue(moment(drawCalendar.template.openDrawTime, 'HH:mm'));
        this.templateForm.controls['closeDrawMinutesBefore'].setValue(drawCalendar.template.closeDrawMinutesBefore);
        this.templateForm.controls['deactivateDrawMonthsAfter'].setValue(drawCalendar.template.deactivateDrawMonthsAfter);
        this.templateForm.controls['deactivateDrawtime'].setValue(moment(drawCalendar.template.deactivateDrawtime, 'HH:mm'));
        this.templateForm.controls['validFromTimestamp'].setValue(moment(drawCalendar.validFromTimestamp));
        this.templateForm.controls['validUntilTimestamp'].setValue(moment(drawCalendar.validUntilTimestamp));
      } else {
        this.templateForm.controls['openDrawDaysBefore'].setValue(undefined);
        this.templateForm.controls['openDrawTime'].setValue(undefined);
        this.templateForm.controls['closeDrawMinutesBefore'].setValue(undefined);
        this.templateForm.controls['deactivateDrawMonthsAfter'].setValue(undefined);
        this.templateForm.controls['deactivateDrawtime'].setValue(undefined);
        this.templateForm.controls['validFromTimestamp'].setValue(undefined);
        this.templateForm.controls['validUntilTimestamp'].setValue(undefined);
        // TODO: HERE reset all properties of the prize program
      }
    });
  }

  ngOnDestroy() {
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
  }

}
