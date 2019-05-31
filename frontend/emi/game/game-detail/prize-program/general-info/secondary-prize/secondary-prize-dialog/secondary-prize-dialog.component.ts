import { Component, OnInit, Inject, ViewChild, ElementRef} from '@angular/core';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';
import { FormGroup, FormControl, Validators } from '@angular/forms';

export interface DialogData {
  dialogTitle: string;
  secondaryPrizeSelected: any;
}

@Component({
  selector: 'secondary-prize-dialog',
  templateUrl: './secondary-prize-dialog.component.html',
  styleUrls: ['./secondary-prize-dialog.component.scss']
})
export class SecondaryPrizeDialogComponent implements OnInit {

  @ViewChild('serieSlide') ref: ElementRef;

  secondaryPrizeForm: FormGroup;
  totalPrize;
  paymentPrize;
  withSerie = true;

  constructor(private dialogRef: MatDialogRef<SecondaryPrizeDialogComponent>, @Inject(MAT_DIALOG_DATA) public data: DialogData) {

  }

  ngOnInit() {
    const seco = this.data.secondaryPrizeSelected;
    this.secondaryPrizeForm = new FormGroup({
      name: new FormControl(seco ? seco.name : '', [Validators.required]),
      quantity: new FormControl(seco ? seco.quantity : '', [Validators.required]),
      totalPrize: new FormControl(seco ? seco.total : '', [Validators.required]),
      paymentPrize: new FormControl(seco ? seco.payment : '', [Validators.required]),
    });
    this.totalPrize = seco.total;
    this.paymentPrize = seco.payment;
    this.withSerie = true;
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
      name: this.secondaryPrizeForm.controls['name'].value,
      quantity: parseInt(this.secondaryPrizeForm.controls['quantity'].value),
      total: parseInt(this.secondaryPrizeForm.controls['totalPrize'].value),
      payment: parseInt(this.secondaryPrizeForm.controls['paymentPrize'].value),
      withSerie: this.withSerie
    });
  }

}
