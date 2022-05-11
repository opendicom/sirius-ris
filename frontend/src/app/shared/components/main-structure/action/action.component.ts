import { Component, OnInit } from '@angular/core';

//--------------------------------------------------------------------------------------------------------------------//
// IMPORTS:
//--------------------------------------------------------------------------------------------------------------------//
import { SharedPropertiesService } from '@shared/services/shared-properties.service';   // Shared Properties
import { SharedFunctionsService } from '@shared/services/shared-functions.service';     // Shared Functions
//--------------------------------------------------------------------------------------------------------------------//

@Component({
  selector: 'app-action',
  templateUrl: './action.component.html',
  styleUrls: ['./action.component.css']
})
export class ActionComponent implements OnInit {
  //Inject services to the constructor:
  constructor(
    public sharedProp: SharedPropertiesService,
    public sharedFunctions: SharedFunctionsService
  ) {
    //Set action properties:
    sharedProp.actionSetter({
      content_title   : false,
      filters_form    : false,
    });

    //Initialize filter param (empty):
    this.sharedProp.filter = '';
  }

  ngOnInit(): void {
  }

  //--------------------------------------------------------------------------------------------------------------------//
  // ON SEARCH:
  //--------------------------------------------------------------------------------------------------------------------//
  onSearch(clear: boolean = false){
    //Check clear filters:
    if(clear){
      //Initialize action fields:
      this.sharedProp.filter = '';
      this.sharedProp.status = '';
    }

    //Refresh request params:
    this.sharedProp.paramsRefresh();

    //Find:
    this.sharedFunctions.find(this.sharedProp.element, this.sharedProp.params);
  }
  //--------------------------------------------------------------------------------------------------------------------//

}
