import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

import { SharedFunctionsService } from '@shared/services/shared-functions.service';

@Component({
  selector: 'app-call-patient',
  templateUrl: './call-patient.component.html'
})
export class CallPatientComponent implements OnInit {
  public form: FormGroup;
  public boards: any[] = [];
  public saving: boolean = false;

  constructor(
    private formBuilder: FormBuilder,
    private sharedFunctions: SharedFunctionsService,
    private dialogRef: MatDialogRef<CallPatientComponent>,
    @Inject(MAT_DIALOG_DATA) public appointment: any
  ) {
    this.form = this.formBuilder.group({
      fk_board: ['', Validators.required],
      room_place: ['', [Validators.required, Validators.maxLength(64)]]
    });
  }

  ngOnInit(): void {
    this.sharedFunctions.find('boards', {}, (res) => {
      this.boards = res.data || [];
    }, false, false, false);
  }

  onSubmit(): void {
    if(this.form.valid){
      this.saving = true;
      const payload = {
        date: new Date().toISOString(),
        fk_patient: this.appointment.fk_patient,
        fk_board: this.form.value.fk_board,
        room_place: this.form.value.room_place
      };
      this.sharedFunctions.save('insert', 'check_in_boards', '', payload, [], (res) => {
        this.saving = false;
        if(res.success){ this.dialogRef.close(true); }
      }, false);
    }
  }
}