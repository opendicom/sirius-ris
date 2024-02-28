import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';

//--------------------------------------------------------------------------------------------------------------------//
// IMPORTS:
//--------------------------------------------------------------------------------------------------------------------//
import { ActivatedRoute, Router } from '@angular/router';                               // Activated Route Interface
import { SharedPropertiesService } from '@shared/services/shared-properties.service';   // Shared Properties
import { SharedFunctionsService } from '@shared/services/shared-functions.service';     // Shared Functions
import {                                                                                // Enviroments
  regexObjectId,
  appointment_requests_flow_states,
  cancellation_reasons,
  ISO_3166,
  document_types,
  gender_types
} from '@env/environment';
//--------------------------------------------------------------------------------------------------------------------//

@Component({
  selector: 'app-list-requests',
  templateUrl: './list-requests.component.html',
  styleUrls: ['./list-requests.component.css']
})
export class ListRequestsComponent implements OnInit {
  //Set component properties:
  public country_codes                  : any = ISO_3166;
  public document_types                 : any = document_types;
  public gender_types                   : any = gender_types;
  public appointmentRequestsFlowStates  : any = appointment_requests_flow_states;
  public cancellation_reasons           : any = cancellation_reasons;

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
  tableToExcel(): void { this.sharedFunctions.tableToXLSX('solicitudes', this.table, this.excludedColumns) }

  //Re-define method in component to use in HTML view:
  public getKeys: any;

  //Inject services to the constructor:
  constructor(
    private router          : Router,
    private objRoute        : ActivatedRoute,
    public sharedProp       : SharedPropertiesService,
    public sharedFunctions  : SharedFunctionsService
  ){
    //Get Logged User Information:
    this.sharedProp.userLogged = this.sharedFunctions.getUserInfo();

    //Pass Service Method:
    this.getKeys = this.sharedFunctions.getKeys;

    //Set action properties:
    sharedProp.actionSetter({
      content_title       : 'Listado de solicitudes',
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
    this.sharedFunctions.find(this.sharedProp.element, this.sharedProp.params);
  }

  addAppointment(current: any){
    //Set current appointment request (Shared object):
    this.sharedProp.current_appointment_request = current;

    //Redirect to set patient form:
    this.router.navigate(['/appointments/set_patient/true']);
  }
}
