import { Component, OnInit, Inject, ViewChild, ElementRef} from '@angular/core';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';
import { FormGroup, FormControl, Validators } from '@angular/forms';

export interface DialogData {
  dialogTitle: string;
  approximationSelected: any;
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
  withSerie = true;

  constructor(private dialogRef: MatDialogRef<ApproximationDialogComponent>, @Inject(MAT_DIALOG_DATA) public data: DialogData) {

  }

  ngOnInit() {
    const seco = this.data.approximationSelected;
    this.approximationForm = new FormGroup({
      name: new FormControl(seco ? seco.name : '', [Validators.required]),
      quantity: new FormControl(seco ? seco.quantity : '', [Validators.required]),
      totalPrize: new FormControl(seco ? seco.total : '', [Validators.required]),
      paymentPrize: new FormControl(seco ? seco.payment : '', [Validators.required]),
    });
    this.totalPrize = seco.total;
    this.paymentPrize = seco.payment;
    this.withSerie = seco.withSerie;
  }

  numberOnly(event): boolean {
    const charCode = (event.which) ? event.which : event.keyCode;
    if (charCode > 31 && (charCode < 48 || charCode > 57)) {
      return false;
    }
    return true;
  }

  changeWithSerie() {
    this.withSerie = ((this.ref as any).checked);
  }


  pushButton(okButton: Boolean) {
    this.dialogRef.close({
      okButton,
      name: this.approximationForm.controls['name'].value,
      quantity: parseInt(this.approximationForm.controls['quantity'].value),
      total: parseInt(this.approximationForm.controls['totalPrize'].value),
      payment: parseInt(this.approximationForm.controls['paymentPrize'].value),
      withSerie: this.withSerie
    });
  }

}
