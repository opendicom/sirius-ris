import { Component, Inject } from '@angular/core';

//--------------------------------------------------------------------------------------------------------------------//
// IMPORTS:
//--------------------------------------------------------------------------------------------------------------------//
import { MAT_DIALOG_DATA } from '@angular/material/dialog';                                       // MatDialog Data
//--------------------------------------------------------------------------------------------------------------------//

@Component({
  selector: 'app-call-patient-exists',
  templateUrl: './call-patient-exists.component.html',
  styleUrls: ['./call-patient-exists.component.css']
})
export class CallPatientExistsComponent {
  //Inject services to the constructor:
  constructor(
    @Inject(MAT_DIALOG_DATA) public data: any  //Inject MAT_DIALOG_DATA to pass data.
  ) { }
}
