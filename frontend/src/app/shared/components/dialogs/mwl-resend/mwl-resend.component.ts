import { Component, Inject, OnInit } from '@angular/core';

//--------------------------------------------------------------------------------------------------------------------//
// IMPORTS:
//--------------------------------------------------------------------------------------------------------------------//
import { MAT_DIALOG_DATA } from '@angular/material/dialog';                                       // MatDialog Data
//--------------------------------------------------------------------------------------------------------------------//

@Component({
  selector: 'app-mwl-resend',
  templateUrl: './mwl-resend.component.html',
  styleUrls: ['./mwl-resend.component.css']
})
export class MwlResendComponent implements OnInit {

  //Inject services to the constructor:
  constructor(
    @Inject(MAT_DIALOG_DATA) public data: any,  //Inject MAT_DIALOG_DATA to pass data.
  ) { }

  ngOnInit(): void {
  }

}
