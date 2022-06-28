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
  public displayedColumns: string[] = ['element_action', 'organization', 'short_name', 'name', 'OID', 'status'];

  //Inject services to the constructor:
  constructor(
    public sharedProp: SharedPropertiesService,
    public sharedFunctions: SharedFunctionsService
  ){
    //Get Logged User Information:
    this.sharedProp.userLogged = this.sharedFunctions.getUserInfo();

    //Set action properties:
    sharedProp.actionSetter({
      content_title   : 'Listado de sucursales',
      content_icon    : 'account_tree',
      add_button      : '/branches/form/insert/0', //Zero indicates empty :id (Activated Route) [content is ignored]
      filters_form    : true,
      filters : {
        search        : true,
        date_range    : false,
        status        : true,
        pager         : true,
      }
    });

    //Set element:
    sharedProp.elementSetter('branches');

    //Initialize action fields:
    this.sharedProp.filter        = '';
    this.sharedProp.status        = '';

    //Initialize selected items:
    this.sharedProp.selected_items = [];

    //Set initial request params:
    this.sharedProp.regex         = 'true';
    this.sharedProp.filterFields  = ['name', 'short_name', 'OID', 'organization.short_name'];
    this.sharedProp.projection    = {
      'fk_organization': 1,
      'name': 1,
      'short_name': 1,
      'OID': 1,
      'status': 1,
      'organization.short_name': 1
    };
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
