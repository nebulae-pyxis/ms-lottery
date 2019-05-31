import { Component, OnInit, Inject, ViewChild, ElementRef} from '@angular/core';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';
import { FormGroup, FormControl, Validators } from '@angular/forms';

export interface DialogData {
  dialogTitle: string;
}

@Component({
  selector: 'approximation-dialog',
  templateUrl: './approximation-dialog.component.html',
  styleUrls: ['./approximation-dialog.component.scss']
})
export class ApproximationDialogComponent implements OnInit {

  @ViewChild('serieSlide') ref: ElementRef;

  approximationForm: FormGroup;
  totalPrize;
  paymentPrize;
  selectedNumberMaskType = 'SAME';
  selectedSerialMaskType = 'ANY';
  selectedApproximationTo = 'GRAND_PRIZE';

  constructor(private dialogRef: MatDialogRef<ApproximationDialogComponent>, @Inject(MAT_DIALOG_DATA) public data: DialogData) {

  }

  ngOnInit() {
    this.approximationForm = new FormGroup({
      name: new FormControl('', [Validators.required]),
      numberMaskRegex: new FormControl('', []),
      totalPrize: new FormControl('', [Validators.required]),
      paymentPrize: new FormControl('', [Validators.required]),
    });
  }

  numberOnly(event): boolean {
    const charCode = (event.which) ? event.which : event.keyCode;
    if (charCode > 31 && (charCode < 48 || charCode > 57)) {
      return false;
    }
    return true;
  }

  pushButton(okButton: Boolean) {
    this.dialogRef.close({
      okButton,
      name: this.approximationForm.controls['name'].value,
      numberMaskRegex: this.approximationForm.controls['numberMaskRegex'].value,
      total: parseInt(this.approximationForm.controls['totalPrize'].value),
      payment: parseInt(this.approximationForm.controls['paymentPrize'].value),
      approximationTo: this.selectedApproximationTo,
      numberMaskType: this.selectedNumberMaskType,
      seriesMaskType: this.selectedSerialMaskType
    });
  }

}
