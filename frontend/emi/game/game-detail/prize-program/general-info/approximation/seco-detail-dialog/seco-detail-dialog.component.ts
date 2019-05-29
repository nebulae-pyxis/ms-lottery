import { Component, OnInit, Inject, ViewChild, ElementRef} from '@angular/core';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { Observable, iif, of, from } from 'rxjs';
import { debounceTime, distinctUntilChanged, tap, filter, mergeMap, toArray } from 'rxjs/operators';

export interface DialogData {
  dialogTitle: string;
  currentSecos: any[];
  availableSecos: any[];
  showManageItems: Boolean;
}

@Component({
  selector: 'seco-detail-dialog',
  templateUrl: './seco-detail-dialog.component.html',
  styleUrls: ['./seco-detail-dialog.component.scss']
})
export class SecoDetailDialogComponent implements OnInit {

  secoDetailForm: FormGroup;
  secoAutoCompleteForm: FormGroup;
  selectedSeco;
  queriedSecosByAutocomplete$: Observable<any[]>;
  secoList;

  constructor(private dialogRef: MatDialogRef<SecoDetailDialogComponent>, @Inject(MAT_DIALOG_DATA) public data: DialogData) {

  }

  ngOnInit() {
    this.secoAutoCompleteForm = new FormGroup({
      seco: new FormControl('')
    });
    if (this.data.currentSecos) {
      this.secoList = this.data.currentSecos.slice(0);
    }
    this.buildLotteryNameFilterCtrl();
  }

  buildLotteryNameFilterCtrl() {
    this.queriedSecosByAutocomplete$ = this.secoAutoCompleteForm.get('seco').valueChanges.pipe(
      debounceTime(200),
      distinctUntilChanged(),
      tap((selected) => {
        if (typeof selected === 'string' || selected instanceof String) {
          this.secoAutoCompleteForm.patchValue({ operator: null });
        }
      }),
      filter(text => (typeof text === 'string' || text instanceof String)),
      mergeMap((x: any) => iif(() => !x, of([]), this.getAllSecossFiltered$(x)))
    );
  }

  getAllSecossFiltered$(filterText: String): Observable<any[]> {
    return from(this.data.availableSecos)
      .pipe(
        filter(seco => this.secoList ? !this.secoList.some(s => s === seco.id) : true),
        filter(seco => seco.name.includes(filterText)),
        toArray()
      );
  }

  addSecoToList() {
    console.log('selectedSeco: ', this.selectedSeco);
    if (this.selectedSeco) {
      if (!this.secoList) {
        this.secoList = [];
      }
      this.secoList.push(this.selectedSeco.id);
      this.selectedSeco = undefined;
      this.secoAutoCompleteForm.controls['seco'].setValue('');
    }
  }
  removeSeco(seco) {
    this.secoList = this.secoList.filter(s => s !== seco);
  }

  getNameById(seco) {
    return this.data.availableSecos.filter(s => s.id === seco)[0].name;
  }


  onSecoSelected(seco) {
    this.secoAutoCompleteForm.patchValue({ seco });
    if (seco) {
      this.selectedSeco = seco;
    }
  }

  secoDisplayFn(seco) {
   return (seco ) ? seco.name : '';

  }

  pushButton(okButton: Boolean) {
    this.dialogRef.close({
      okButton,
      approximationsTolds: this.secoList
    });
  }

}
