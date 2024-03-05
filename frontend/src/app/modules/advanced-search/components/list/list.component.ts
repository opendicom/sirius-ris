import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';

//--------------------------------------------------------------------------------------------------------------------//
// IMPORTS:
//--------------------------------------------------------------------------------------------------------------------//
import { SharedPropertiesService } from '@shared/services/shared-properties.service';         // Shared Properties
import { SharedFunctionsService } from '@shared/services/shared-functions.service';           // Shared Functions
import { PdfService } from '@shared/services/pdf.service';                                    // PDF Service
import {                                                                                      // Enviroments
  performing_flow_states,
  ISO_3166,
  document_types,
  gender_types,
  cancellation_reasons
} from '@env/environment';
//--------------------------------------------------------------------------------------------------------------------//

@Component({
  selector: 'app-list',
  templateUrl: './list.component.html',
  styleUrls: ['./list.component.css']
})
export class ListComponent implements OnInit {
  //Set component properties:
  public country_codes          : any = ISO_3166;
  public document_types         : any = document_types;
  public gender_types           : any = gender_types;
  public performing_flow_states : any = performing_flow_states;
  public cancellation_reasons   : any = cancellation_reasons;

  //Table to XLSX (SheetJS CE):
  private excludedColumns = ['Acciones'];
  @ViewChild('main_list') table!: ElementRef;
  tableToExcel(): void { this.sharedFunctions.tableToXLSX('estudios', this.table, this.excludedColumns) }

  //Set visible columns of the list:
  public displayedColumns: string[] = [
    'element_action',
    'flow_state',
    'date',
    'documents',
    'names',
    'surnames',
    'patient_age',
    'details',
    'domain'
  ];

  //Inject services to the constructor:
  constructor(
    public sharedProp       : SharedPropertiesService,
    public sharedFunctions  : SharedFunctionsService,
    public pdfService       : PdfService
  ) {
    //Get Logged User Information:
    this.sharedProp.userLogged = this.sharedFunctions.getUserInfo();

    //Set action properties:
    sharedProp.actionSetter({
      content_title       : 'Búsqueda avanzada de informes',
      content_icon        : 'search',
      add_button          : false,
      duplicated_surnames : false,                        // Check duplicated surnames
      nested_element      : false,                        // Set nested element
      filters_form        : true,
      filters : {
        search        : true,
        date          : false,
        date_range    : 'performing.date',
        urgency       : false,
        flow_state    : true,
        status        : false,
        modality      : 'modality._id',
        fk_user       : false,
        log_event     : false,
        pager         : true,
        clear_filters : true,
      },
      advanced_search : true
    });

    //Set element:
    sharedProp.elementSetter('reports');

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
      'appointment.imaging.organization.short_name',
      'appointment.imaging.branch.short_name',
      'appointment.imaging.service.name',

      'appointment.referring.organization.short_name',
      'appointment.referring.branch.short_name',
      'appointment.referring.service.name',

      'appointment.reporting.organization.short_name',
      'appointment.reporting.branch.short_name',
      'appointment.reporting.service.name',

      'patient.person.documents.document',
      'patient.person.name_01',
      'patient.person.name_02',
      'patient.person.surname_01',
      'patient.person.surname_02',

      'procedure.name',
      'equipment.name'
    ];
    this.sharedProp.projection    = {
      'appointment.imaging': 1,
      'appointment.referring': 1,
      'appointment.reporting': 1,
      
      'appointment.attached_files._id': 1,    //Only _id and name for performing downloads dialog.
      'appointment.attached_files.name': 1,   //Only _id and name for performing downloads dialog.

      'appointment._id': 1,
      'appointment_request._id': 1,
      'appointment_request.extra.physician_name': 1,
      
      'fk_performing': 1,
      'performing.flow_state': 1,
      'performing.date': 1,
      'performing.cancellation_reasons': 1, 

      'patient': 1,
      'equipment.name': 1,
      'equipment.AET': 1,
      'procedure.name': 1,
      'procedure.code': 1,
      'modality': 1
    };
    this.sharedProp.sort            = { /*status: -1*/ };
    this.sharedProp.pager           = { page_number: 1, page_limit: this.sharedProp.mainSettings.appSettings.default_page_sizes[0] };
    this.sharedProp.group           = { id: 'fk_performing', order: 'last' };

    //Reset advanced search params:
    this.sharedProp.advanced_search = { ... this.sharedProp.action.default_advanced_search };
    this.sharedProp.pathologies_input = '';
    this.sharedProp.advanced_search.pathologies = [];

    //Refresh request params:
    sharedProp.paramsRefresh();
  }

  ngOnInit(): void {
    //Find active users:
    this.findActiveUsers('signer');
    this.findActiveUsers('authenticator');

    //Get Logged User Information (Domain and domain type):
    const domain = this.sharedProp.userLogged.permissions[0].domain;
    const domainType = this.sharedProp.userLogged.permissions[0].type;

    //Refresh current organization (To filter by pathologies):
    this.sharedFunctions.getLoggedOrganization(domain, domainType, (result) => {
      //Refresh organization in shared properties:
      this.sharedProp.current_organization = result;

      //Refresh available pathologies:
      this.sharedFunctions.findPathologies(result, (resPathologies) => {
        this.sharedProp.availablePathologies = [... resPathologies];
        this.sharedProp.filteredPathologies = [... resPathologies];
      });
    });

    //Clear previous responses:
    this.sharedFunctions.response = false;
  }

  findActiveUsers(roleInReport: string){
    if(roleInReport !== undefined && roleInReport !== null && roleInReport !== ''){
      //Set params:
      const params: any = {
        'role_in_report': roleInReport,
        'filter[status]': true,
        'proj[person.name_01]': 1,
        'proj[person.name_02]': 1,
        'proj[person.surname_01]': 1,
        'proj[person.surname_02]': 1,
        'proj[permissions]': 1
      };

      //Find by role in report (last parameter specific AditionalRequest):
      this.sharedFunctions.find('users', params, (res) => {
        //Check result:
        if(res.success === true){
          switch(roleInReport){
            case 'signer':
              this.sharedProp.current_signer_users = res.data;
              break;
            case 'authenticator':
              this.sharedProp.current_authenticator_users = res.data;
              break;
          }
        }
      }, false, 'findByRoleInReport', false);
    }
  }
}
