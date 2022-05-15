import { Component, OnInit } from '@angular/core';

//--------------------------------------------------------------------------------------------------------------------//
// IMPORTS:
//--------------------------------------------------------------------------------------------------------------------//
import { SharedPropertiesService } from '@shared/services/shared-properties.service';   // Shared Properties
import { SharedFunctionsService } from '@shared/services/shared-functions.service';     // Shared Functions
import { default_page_sizes } from '@env/environment';                                  // Enviroment
//--------------------------------------------------------------------------------------------------------------------//

@Component({
  selector: 'app-list',
  templateUrl: './list.component.html',
  styleUrls: ['./list.component.css']
})
export class ListComponent implements OnInit {
  //Set visible columns of the list:
  public displayedColumns: string[] = ['element_action', 'short_name', 'name', 'OID', 'status'];

  //Inject services to the constructor:
  constructor(
    public sharedProp: SharedPropertiesService,
    public sharedFunctions: SharedFunctionsService
  ){
    //Set action properties:
    sharedProp.actionSetter({
      content_title   : 'Listado de organizaciones',
      content_icon    : 'apartment',
      add_button      : '/organizations/form/new/0', //Zero indicates empty :id (Activated Route) [content is ignored]
      filters_form    : true,
      filters : {
        search        : true,
        date_range    : false,
        status        : true,
        pager         : true,
      }
    });

    //Set element:
    sharedProp.elementSetter('organizations');

    //Initialize action fields:
    this.sharedProp.filter        = '';
    this.sharedProp.status        = '';

    //Set initial request params:
    this.sharedProp.regex         = 'true';
    this.sharedProp.filterFields  = ['name', 'short_name', 'OID'];
    this.sharedProp.projection    = { name: 1, short_name: 1, 'OID': 1, status: 1 };
    this.sharedProp.sort          = { status: -1 };
    this.sharedProp.pager         = { page_number: 1, page_limit: default_page_sizes[0] };

    //Refresh request params:
    sharedProp.paramsRefresh();
  }

  ngOnInit(): void {
    //First search (List):
    this.sharedFunctions.find(this.sharedProp.element, this.sharedProp.params);
  }
}
