import { Component, Inject, OnInit } from '@angular/core';

//--------------------------------------------------------------------------------------------------------------------//
// IMPORTS:
//--------------------------------------------------------------------------------------------------------------------//
import { MAT_DIALOG_DATA } from '@angular/material/dialog';                                       // MatDialog Data
import { I18nService } from '@shared/services/i18n.service';                                      // I18n Service
//--------------------------------------------------------------------------------------------------------------------//

@Component({
  selector: 'app-overlap-events',
  templateUrl: './overlap-events.component.html',
  styleUrls: ['./overlap-events.component.css']
})
export class OverlapEventsComponent implements OnInit {

  //Inject services to the constructor:
  constructor(
    @Inject(MAT_DIALOG_DATA) public data: any,  //Inject MAT_DIALOG_DATA to pass data:
    public i18n: I18nService
  ) { }

  ngOnInit(): void {
  }

}
