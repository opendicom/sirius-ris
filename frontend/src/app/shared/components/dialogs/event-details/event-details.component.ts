import { Component, Inject, OnInit } from '@angular/core';

//--------------------------------------------------------------------------------------------------------------------//
// IMPORTS:
//--------------------------------------------------------------------------------------------------------------------//
import { MAT_DIALOG_DATA } from '@angular/material/dialog';                                       // MatDialog Data
import { SharedPropertiesService } from '@shared/services/shared-properties.service';             // Shared Properties
import { document_types, ISO_3166 } from '@env/environment';                                      // Enviroment
//--------------------------------------------------------------------------------------------------------------------//

@Component({
  selector: 'app-event-details',
  templateUrl: './event-details.component.html',
  styleUrls: ['./event-details.component.css']
})
export class EventDetailsComponent implements OnInit {
  public country_codes    : any = ISO_3166;
  public document_types   : any = document_types;

  //Inject services to the constructor:
  constructor(
    @Inject(MAT_DIALOG_DATA) public data: any,  //Inject MAT_DIALOG_DATA to pass data:
    public sharedProp: SharedPropertiesService
  ) { }

  ngOnInit(): void {
  }

}
