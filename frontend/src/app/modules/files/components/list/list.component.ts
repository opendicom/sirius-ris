import { Component, OnInit } from '@angular/core';

//--------------------------------------------------------------------------------------------------------------------//
// IMPORTS:
//--------------------------------------------------------------------------------------------------------------------//
import { ActivatedRoute } from '@angular/router';                                       // Activated Route Interface
import { SharedPropertiesService } from '@shared/services/shared-properties.service';   // Shared Properties
import { SharedFunctionsService } from '@shared/services/shared-functions.service';     // Shared Functions
import { FileManagerService } from '@shared/services/file-manager.service';             // File manager service
import { app_setting, regexObjectId } from '@env/environment';                          // Enviroments
//--------------------------------------------------------------------------------------------------------------------//

@Component({
  selector: 'app-list',
  templateUrl: './list.component.html',
  styleUrls: ['./list.component.css']
})
export class ListComponent implements OnInit {
  //Set visible columns of the list:
  public displayedColumns: string[] = ['select_element', 'organization', 'branch', 'name', 'download'];

  //Re-define method in component to use in HTML view:
  public getKeys: any;

  //Inject services to the constructor:
  constructor(
    private objRoute        : ActivatedRoute,
    public sharedProp       : SharedPropertiesService,
    public sharedFunctions  : SharedFunctionsService,
    public fileManager      : FileManagerService
  ){
    //Get Logged User Information:
    this.sharedProp.userLogged = this.sharedFunctions.getUserInfo();

    //Pass Service Method:
    this.getKeys = this.sharedFunctions.getKeys;

    //Set action properties:
    sharedProp.actionSetter({
      content_title       : 'Listado de archivos',
      content_icon        : 'folder',
      add_button          : false,
      duplicated_surnames : false,    // Check duplicated surnames
      nested_element      : false,    // Set nested element
      filters_form        : true,
      filters : {
        search        : true,
        date          : false,
        date_range    : false,
        status        : false,
        urgency       : false,
        flow_state    : false,
        pager         : true,
        modality      : false,
        clear_filters : true
      }
    });

    //Set element:
    sharedProp.elementSetter('files');

    //Initialize action fields:
    this.sharedProp.filter        = '';
    this.sharedProp.urgency       = '';
    this.sharedProp.status        = '';
    this.sharedProp.flow_state    = '';
    this.sharedProp.date          = '';
    this.sharedProp.date_range = {
      start : '',
      end   : ''
    };
    this.sharedProp.modality      = '';

    //Initialize selected items:
    this.sharedProp.selected_items = [];
    this.sharedProp.checked_items = [];

    //Set initial request params:
    this.sharedProp.regex         = 'true';
    this.sharedProp.filterFields  = ['organization.short_name', 'branch.short_name', 'name'];
    this.sharedProp.projection    = {
      'domain': 1,
      'name': 1,
      'organization.short_name': 1,
      'branch.short_name': 1
    };
    this.sharedProp.sort          = { 'organization.short_name': 1, 'branch.short_name': 1, name: 1 };
    this.sharedProp.pager         = { page_number: 1, page_limit: app_setting.default_page_sizes[0] };

    //Refresh request params:
    sharedProp.paramsRefresh();
  }

  ngOnInit(): void {
    //Extract sent data (Parameters by routing):
    const id = this.objRoute.snapshot.params['_id'];

    //If have an _id and this is valid ObjectId, change params to findById:
    if(id !== undefined && regexObjectId.test(id)){
      this.sharedProp.params['filter[_id]'] = id;
    }

    //First search (List):
    this.sharedFunctions.find(this.sharedProp.element, this.sharedProp.params);
  }

}
