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

    //Initialize action fields:
    this.sharedProp.filter        = '';
    this.sharedProp.status        = '';

    //Set initial request params:
    this.sharedProp.regex         = 'true';
    this.sharedProp.filterFields  = ['code_meaning', 'code_value'];
    this.sharedProp.projection    = { code_meaning: 1, code_value: 1, status: 1 };
    this.sharedProp.sort          = { status: -1 };
    this.sharedProp.pager         = { page_number: 1, page_limit: 10 };

    //Refresh request params:
    sharedProp.paramsRefresh();
  }

  ngOnInit(): void {
    //First search (List):
    this.sharedFunctions.find(this.sharedProp.element, this.sharedProp.params);
  }
}