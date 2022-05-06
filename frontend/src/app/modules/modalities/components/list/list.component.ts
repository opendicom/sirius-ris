import { Component, OnInit } from '@angular/core';

//--------------------------------------------------------------------------------------------------------------------//
// IMPORTS:
//--------------------------------------------------------------------------------------------------------------------//
import { SharedPropertiesService } from '@shared/services/shared-properties.service';   // Shared Properties
import { SharedFunctionsService } from '@shared/services/shared-functions.service';     // Shared Functions
//--------------------------------------------------------------------------------------------------------------------//

@Component({
  selector: 'app-list',
  templateUrl: './list.component.html',
  styleUrls: ['./list.component.css']
})
export class ListComponent implements OnInit {
  //Set visible columns of the list:
  public displayedColumns: string[] = ['element_action', 'code_meaning', 'code_value', 'status'];

  //Inject services to the constructor:
  constructor(
    public sharedProp: SharedPropertiesService,
    public sharedFunctions: SharedFunctionsService
  ){
    //Set action properties:
    sharedProp.actionSetter({
      content_title   : 'Listado de modalidades',
      content_icon    : 'multiple_stop',
      add_button      : '/modalities/form/new/0', //Zero indicates empty :id (Activated Route) [content is ignored]
      filters_form    : true,
      filters : {
        search        : true,
        date_range    : false,
        status        : true,
        madalities    : false,
        institutions  : false,
      }
    });

    //Set element:
    sharedProp.elementSetter('modalities');

    //Set initial request params:
    sharedProp.paramsSetter({
      //Projection:
      'proj[createdAt]': 0,
      'proj[updatedAt]': 0,
      'proj[__v]': 0,

      //Sort:
      'sort[status]' : -1,

      //Pager:
      'pager[page_number]': 1,
      'pager[page_limit]': 10,
    });
  }

  ngOnInit(): void {
    //First search (List):
    this.sharedFunctions.find(this.sharedProp.element, this.sharedProp.params);
  }
}
