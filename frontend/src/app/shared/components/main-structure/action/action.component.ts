import { Component, OnInit } from '@angular/core';

//--------------------------------------------------------------------------------------------------------------------//
// IMPORTS:
//--------------------------------------------------------------------------------------------------------------------//
import { SharedPropertiesService } from '@shared/services/shared-properties.service';   // Shared Properties
//--------------------------------------------------------------------------------------------------------------------//

@Component({
  selector: 'app-action',
  templateUrl: './action.component.html',
  styleUrls: ['./action.component.css']
})
export class ActionComponent implements OnInit {

  //Inject services to the constructor:
  constructor(public sharedProp: SharedPropertiesService) {
    //Set action properties:
    sharedProp.actionSetter({
      content_title   : false,
      filters_form    : false,
    });
  }

  ngOnInit(): void {
  }

}
