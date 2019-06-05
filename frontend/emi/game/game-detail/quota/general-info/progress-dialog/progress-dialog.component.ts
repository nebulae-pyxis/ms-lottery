import { Component, OnInit, Inject, ViewChild, ElementRef} from '@angular/core';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { QuotaService } from '../../quota.service';
import { takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';

export interface DialogData {
  dialogTitle: string;
}

@Component({
  selector: 'progress-dialog',
  templateUrl: './progress-dialog.component.html',
  styleUrls: ['./progress-dialog.component.scss']
})
export class ProgressDialogComponent implements OnInit {

  value = 0;
  private ngUnsubscribe = new Subject();
  constructor(private dialogRef: MatDialogRef<ProgressDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: DialogData,
    public quotaService: QuotaService) {

  }

  ngOnInit() {
    console.log('Se ejecuta el onInit');
    this.quotaService.currentUploadProgress$.pipe(
      takeUntil(this.ngUnsubscribe)
    ).subscribe(val => {
      this.value = val;
      if (val >= 100) {
        this.ngUnsubscribe.next();
        this.ngUnsubscribe.complete();
        this.dialogRef.disableClose = false;
        this.dialogRef.close();
       }
    }, error => { },
    () => console.log('Se completa dialogo'));
  }

  pushButton(okButton: Boolean) {
  }

}
