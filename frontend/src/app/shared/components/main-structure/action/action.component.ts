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
  public filter: any;

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

    //Initialize filter (empty):
    this.filter = '';
  }

  ngOnInit(): void {
  }

  //--------------------------------------------------------------------------------------------------------------------//
  // ON SEARCH:
  //--------------------------------------------------------------------------------------------------------------------//
  onSearch(){
    const new_params = {
      //Filter:
      'filter[code_value]': 'RM',

      //Projection:
      'proj[createdAt]': 0,
      'proj[updatedAt]': 0,
      'proj[__v]': 0,

      //Sort:
      'sort[status]' : -1,

      //Pager:
      'pager[page_number]': 1,
      'pager[page_limit]': 10,
    };

    alert(this.filter);
    console.log(this.sharedProp.params);

    this.sharedFunctions.find(this.sharedProp.element, new_params);
  }
  //--------------------------------------------------------------------------------------------------------------------//

}
