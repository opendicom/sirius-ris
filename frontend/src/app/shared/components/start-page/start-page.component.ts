import { Component, OnInit } from '@angular/core';

//--------------------------------------------------------------------------------------------------------------------//
// IMPORTS:
//--------------------------------------------------------------------------------------------------------------------//
import { SharedPropertiesService } from '@shared/services/shared-properties.service';   // Shared Properties
//--------------------------------------------------------------------------------------------------------------------//

@Component({
  selector: 'app-start-page',
  templateUrl: './start-page.component.html',
  styleUrls: ['./start-page.component.css']
})
export class StartPageComponent implements OnInit {

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
