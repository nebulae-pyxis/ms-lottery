import { Component, OnInit, Inject} from '@angular/core';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';
import { FormGroup, FormControl, Validators } from '@angular/forms';

export interface DialogData {
  dialogTitle: string;
  dialogMessage: string;
}

@Component({
  selector: 'app-note-dialog.component',
  templateUrl: './note-dialog.component.html',
  styleUrls: ['./note-dialog.component.scss']
})
export class NoteDialogComponent implements OnInit {

  notesForm: FormGroup;

  constructor(private dialogRef: MatDialogRef<NoteDialogComponent>, @Inject(MAT_DIALOG_DATA) public data: DialogData) {

  }

  ngOnInit() {
    this.notesForm = new FormGroup({
      notes: new FormControl('', [Validators.required])
    });
  }

  pushButton(okButton: Boolean) {
    this.dialogRef.close({okButton, notes: this.notesForm.controls['notes'].value});
  }

}
