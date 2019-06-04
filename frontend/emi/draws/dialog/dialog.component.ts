import { Component, OnInit, Inject} from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';

export interface DialogData {
  dialogTitle: string;
  dialogMessage: string;
}

@Component({
// tslint:disable-next-line: component-selector
  selector: 'app-dialog.component',
  templateUrl: './dialog.component.html',
  styleUrls: ['./dialog.component.scss']
})
export class ConfirmationDialogComponent implements OnInit {

  constructor(
    private dialogRef: MatDialogRef<ConfirmationDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: DialogData
  ){

  }

  ngOnInit() {

  }

  pushButton(okButton: Boolean) {
    this.dialogRef.close(okButton);
  }

}
