import { Component, Inject, OnInit } from '@angular/core';

//--------------------------------------------------------------------------------------------------------------------//
// IMPORTS:
//--------------------------------------------------------------------------------------------------------------------//
import { MAT_DIALOG_DATA } from '@angular/material/dialog';                                       // MatDialog Data
//--------------------------------------------------------------------------------------------------------------------//

@Component({
  selector: 'app-overlap-events',
  templateUrl: './overlap-events.component.html',
  styleUrls: ['./overlap-events.component.css']
})
export class OverlapEventsComponent implements OnInit {

  //Inject services to the constructor:
  constructor(
    @Inject(MAT_DIALOG_DATA) public data: any  //Inject MAT_DIALOG_DATA to pass data:
  ) { }

  ngOnInit(): void {
  }

}
