import { Component, OnInit, DoCheck, ViewChild, ElementRef } from '@angular/core';

//--------------------------------------------------------------------------------------------------------------------//
// IMPORTS:
//--------------------------------------------------------------------------------------------------------------------//
import { ActivatedRoute, Router } from '@angular/router';                               // Activated Route Interface
import { SharedPropertiesService } from '@shared/services/shared-properties.service';   // Shared Properties
import { SharedFunctionsService } from '@shared/services/shared-functions.service';     // Shared Functions
import { I18nService } from '@shared/services/i18n.service';                            // I18n Service
import { regexObjectId, ISO_3166, objectKeys } from '@env/environment';                 // Enviroments
//--------------------------------------------------------------------------------------------------------------------//

@Component({
  selector: 'app-list-requests',
  templateUrl: './list-requests.component.html',
  styleUrls: ['./list-requests.component.css']
})
export class ListRequestsComponent implements OnInit, DoCheck {
  //Set component properties:
  public country_codes                  : any = ISO_3166;
  public documentTypesKeys              : string[] = objectKeys.documentTypesKeys;
  public appointmentRequestsFlowStateKeys: string[] = objectKeys.appointmentRequestsFlowStateKeys;

  //Loading state management:
  public loading: boolean = false;
  private initialLoad: boolean = true;
  private previousParams: any;
  private previousResponse: any;

  //Set visible columns of the list:
  public displayedColumns: string[] = [
    'select_element', 
    'element_action', 
    'flow_state', 
    'date',
    'document',
    'names',
    'surnames',
    'patient_age',
    'gender',
    'phone_numbers',
    'details',
    'referring',
    'imaging', 
    'urgency'
  ];

  //Table to XLSX (SheetJS CE):
  private excludedColumns = ['Acciones', 'Descargar'];
  @ViewChild('main_list') table!: ElementRef;
  tableToExcel(): void { this.sharedFunctions.tableToXLSX(this.i18n.instant('APPOINTMENTS.LIST_REQUESTS.XLSX_SHEET_NAME'), this.table, this.excludedColumns) }

  //Re-define method in component to use in HTML view:
  public getKeys: any;

  //Inject services to the constructor:
  constructor(
    private router          : Router,
    private objRoute        : ActivatedRoute,
    public sharedProp       : SharedPropertiesService,
    public sharedFunctions  : SharedFunctionsService,
    private i18n            : I18nService
  ){
    //Get Logged User Information:
    this.sharedProp.userLogged = this.sharedFunctions.getUserInfo();

    //Pass Service Method:
    this.getKeys = this.sharedFunctions.getKeys;

    //Set action properties:
    sharedProp.actionSetter({
      content_title       : this.i18n.instant('APPOINTMENTS.LIST_REQUESTS.TITLE'),
      content_icon        : 'move_to_inbox',
      add_button          : false,
      duplicated_surnames : false,    // Check duplicated surnames
      nested_element      : false,    // Set nested element
      filters_form        : true,
      filters : {
        search        : true,
        date          : false,
        date_range    : false,
        status        : false,
        urgency       : true,
        flow_state    : true,
        modality      : 'modality._id',   //FK name in schema
        fk_user       : false,
        log_event     : false,
        pager         : true,
        clear_filters : true
      },
      advanced_search : false
    });

    //Set element:
    sharedProp.elementSetter('appointment_requests');

    //Initialize action fields:
    this.sharedProp.filter        = '';
    this.sharedProp.urgency       = '';
    this.sharedProp.status        = '';
    this.sharedProp.flow_state    = '';
    this.sharedProp.date          = '';
    this.sharedProp.date_range    = {
      start : '',
      end   : ''
    };
    this.sharedProp.modality      = '';
    this.sharedProp.fk_user       = '';
    this.sharedProp.log_event     = '';
    this.sharedProp.log_element   = '';

    //Initialize selected items:
    this.sharedProp.selected_items = [];
    this.sharedProp.checked_items = [];

    //Set initial request params:
    this.sharedProp.regex         = 'true';
    this.sharedProp.filterFields  = [
      'imaging.organization.short_name',
      'imaging.branch.short_name',
      'referring.organization.short_name',
      'referring.branch.short_name',
      'patient.document',
      'patient.name_01',
      'patient.name_02',
      'patient.surname_01',
      'patient.surname_02',
      'patient.phone_numbers'
    ];
    this.sharedProp.projection    = {
      // Empty projection to preserve all fields from appointment_requests (Preserve for sharedProp.appointment_request):
      /* Needed fields for the list:
      'flow_state': 1,
      'imaging.organization.short_name': 1,
      'imaging.branch.short_name': 1,
      'referring.organization.short_name': 1,
      'referring.branch.short_name': 1,
      'patient': 1,
      'urgency': 1,
      'createdAt': 1,
      'study': 1,
      'procedure': 1,
      'modality': 1
      */
    };
    this.sharedProp.sort          = { 'createdAt': 1, 'organization.short_name': 1, 'branch.short_name': 1 };
    this.sharedProp.pager         = { page_number: 1, page_limit: this.sharedProp.mainSettings.appSettings.default_page_sizes[0] };
    this.sharedProp.group         = false;

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
    this.loading = true;
    this.sharedFunctions.find(this.sharedProp.element, this.sharedProp.params, resRequests => {
      this.loading = false;
      this.previousParams = JSON.parse(JSON.stringify(this.sharedProp.params));
      this.previousResponse = this.sharedFunctions.response;
      this.initialLoad = false;
    });
  }

  ngDoCheck(): void {
    if(this.initialLoad){
      return;
    }
    const currentParamsStr = JSON.stringify(this.sharedProp.params);
    const previousParamsStr = JSON.stringify(this.previousParams);
    if(currentParamsStr !== previousParamsStr){
      this.loading = true;
      this.previousParams = JSON.parse(currentParamsStr);
      return;
    }
    if(this.sharedFunctions.response !== this.previousResponse){
      this.previousResponse = this.sharedFunctions.response;
      if(this.sharedFunctions.response){
        this.loading = false;
      }
    }
  }

  addAppointment(current: any){
    //Set current appointment request (Shared object):
    this.sharedProp.current_appointment_request = current;

    //Redirect to set patient form:
    this.router.navigate(['/appointments/set_patient/true']);
  }
}
