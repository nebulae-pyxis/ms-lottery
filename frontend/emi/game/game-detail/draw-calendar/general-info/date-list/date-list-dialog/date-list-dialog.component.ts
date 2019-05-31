import { Component, OnInit, Inject, ViewChild, ElementRef} from '@angular/core';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { DrawCalendarService } from '../../../draw-calendar.service';
import { MAT_DATE_LOCALE, DateAdapter, MomentDateAdapter, MAT_DATE_FORMATS } from '@coachcare/datepicker';
import { MAT_MOMENT_DATE_FORMATS } from '../../../my-date-format';
import * as moment from 'moment';

export interface DialogData {
  dialogTitle: string;
  dateListSelected: any;
}

@Component({
  selector: 'date-list-dialog',
  templateUrl: './date-list-dialog.component.html',
  styleUrls: ['./date-list-dialog.component.scss'],
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
export class DateListDialogComponent implements OnInit {

  dateListForm: FormGroup;

  constructor(private dialogRef: MatDialogRef<DateListDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: DialogData,
    private drawCalendarService: DrawCalendarService) {

  }

  ngOnInit() {
    const seco = this.data.dateListSelected;
    this.dateListForm = new FormGroup({
      openingDatetime: new FormControl('', [Validators.required]),
      closingDatetime: new FormControl('', [Validators.required]),
      drawingDatetime: new FormControl('', [Validators.required]),
      deactivationDatetime: new FormControl('', [Validators.required]),
    });
  }

  numberOnly(event): boolean {
    const charCode = (event.which) ? event.which : event.keyCode;
    if (charCode > 31 && (charCode < 48 || charCode > 57)) {
      return false;
    }
    return true;
  }

  drawingDatetimeChanged(event) {
    // Build opening date time
    let selecteDrawTime = moment(this.dateListForm.controls['drawingDatetime'].value);
    const hourOfOpenDrawDate = moment(this.drawCalendarService.template.openDrawTime, 'HH:mm');
    selecteDrawTime.subtract(this.drawCalendarService.template.openDrawDaysBefore, 'days');
    selecteDrawTime.set({hour: hourOfOpenDrawDate.hours(), minute: hourOfOpenDrawDate.minutes(), second: 0, millisecond: 0});
    this.dateListForm.controls['openingDatetime'].setValue(selecteDrawTime);

    // Build closing date time
    selecteDrawTime = moment(this.dateListForm.controls['drawingDatetime'].value);
    selecteDrawTime.subtract(this.drawCalendarService.template.closeDrawMinutesBefore, 'minutes');
    this.dateListForm.controls['closingDatetime'].setValue(selecteDrawTime);

    // Build deactivation datetime
    selecteDrawTime = moment(this.dateListForm.controls['drawingDatetime'].value);
    const hourOfDeactivationDrawDate = moment(this.drawCalendarService.template.deactivateDrawtime, 'HH:mm');
    selecteDrawTime.add(this.drawCalendarService.template.deactivateDrawMonthsAfter, 'months');
    selecteDrawTime.set({hour: hourOfDeactivationDrawDate.hours(), minute: hourOfDeactivationDrawDate.minutes(), second: 0, millisecond: 0});
    this.dateListForm.controls['deactivationDatetime'].setValue(selecteDrawTime);
  }

  pushButton(okButton: Boolean) {
    this.dialogRef.close({
      okButton,
      openingDatetime: this.dateListForm.controls['openingDatetime'].value.valueOf(),
      closingDatetime: this.dateListForm.controls['closingDatetime'].value.valueOf(),
      drawingDatetime: this.dateListForm.controls['drawingDatetime'].value.valueOf(),
      deactivationDatetime: this.dateListForm.controls['deactivationDatetime'].value.valueOf(),
    });
  }

}
