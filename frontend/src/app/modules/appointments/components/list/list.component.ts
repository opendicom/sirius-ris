import { Component, OnInit, DoCheck, ViewChild, ElementRef } from '@angular/core';

//--------------------------------------------------------------------------------------------------------------------//
// IMPORTS:
//--------------------------------------------------------------------------------------------------------------------//
import { ActivatedRoute } from '@angular/router';                                               // Activated Route Interface
import { SharedPropertiesService } from '@shared/services/shared-properties.service';           // Shared Properties
import { SharedFunctionsService } from '@shared/services/shared-functions.service';             // Shared Functions
import { PdfService } from '@shared/services/pdf.service';                                      // PDF Service
import { I18nService } from '@app/shared/services/i18n.service';                                // I18n Service
import { regexObjectId, ISO_3166, objectKeys } from '@env/environment';                         // Enviroments
//--------------------------------------------------------------------------------------------------------------------//

@Component({
  selector: 'app-list',
  templateUrl: './list.component.html',
  styleUrls: ['./list.component.css']
})
export class ListComponent implements OnInit, DoCheck {
  //Set component properties:
  public country_codes          : any = ISO_3166;
  public documentTypesKeys      : string[] = objectKeys.documentTypesKeys;
  public loading                : boolean = false;
  private initialLoad           : boolean = true;
  private previousParams        : any = null;
  private previousResponse      : any = null;

  //Table to XLSX (SheetJS CE):
  private excludedColumns = ['Acciones'];
  @ViewChild('main_list') table!: ElementRef;
  tableToExcel(): void { this.sharedFunctions.tableToXLSX(this.i18n.instant('APPOINTMENTS.LIST.XLSX_SHEET_NAME'), this.table, this.excludedColumns) }

  //Set visible columns of the list:
  public displayedColumns: string[] = [
    'element_action',
    'flow_state',
    'date',
    'schedule',
    'documents',
    'names',
    'surnames',
    'patient_age',
    'details',
    'outpatient_inpatient',
    'urgency',
    'status',
    'domain'
  ];

  //Inject services to the constructor:
  constructor(
    private objRoute        : ActivatedRoute,
    public sharedProp       : SharedPropertiesService,
    public sharedFunctions  : SharedFunctionsService,
    public pdfService       : PdfService,
    private i18n            : I18nService
  ){
    //Get Logged User Information:
    this.sharedProp.userLogged = this.sharedFunctions.getUserInfo();

    //Set action properties:
    sharedProp.actionSetter({
      content_title       : this.i18n.instant('APPOINTMENTS.LIST.TITLE'),
      content_icon        : 'event_available',
      add_button          : '/appointments/set_patient',
      manage_drafts       : '/appointments/list_drafts',
      appointments_drafts : false,
      duplicated_surnames : false,    // Check duplicated surnames
      nested_element      : false,    // Set nested element
      filters_form        : true,
      filters : {
        search        : true,
        date          : false,
        date_range    : 'start-end',
        urgency       : true,
        status        : true,
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
    sharedProp.elementSetter('appointments');

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
      'imaging.service.name',

      'referring.organization.short_name',
      'referring.branch.short_name',
      'referring.service.name',

      'reporting.organization.short_name',
      'reporting.branch.short_name',
      'reporting.service.name',

      'patient.person.documents.document',
      'patient.person.name_01',
      'patient.person.name_02',
      'patient.person.surname_01',
      'patient.person.surname_02',

      'procedure.name',
      'slot.equipment.name'
    ];
    this.sharedProp.projection    = {
      'appointment_request': 1,
      'imaging': 1,
      'referring': 1,
      'reporting': 1,
      'start': 1,
      'end': 1,
      'flow_state': 1,
      'cancellation_reasons': 1,
      'outpatient': 1,
      'inpatient': 1,
      'patient': 1,
      'urgency': 1,
      'status': 1,
      'slot.equipment.name': 1,
      'slot.equipment.AET': 1,
      'procedure.name': 1,
      'procedure.code': 1,
      'modality': 1,
      'overbooking': 1
    };
    this.sharedProp.sort          = { 'start': -1, 'urgency': 1, 'status': -1, 'imaging.organization._id': 1 };
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

    //Set loading state:
    this.loading = true;

    //First search (List):
    this.sharedFunctions.find(this.sharedProp.element, this.sharedProp.params, resAppointments => {
      //Set loading to false when data is received:
      this.loading = false;
      
      //Initialize base state for change detection after initial load:
      this.previousParams = JSON.parse(JSON.stringify(this.sharedProp.params));
      this.previousResponse = this.sharedFunctions.response;
      
      //Mark initial load as complete:
      this.initialLoad = false;
    });
  }

  ngDoCheck(): void {
    //Only execute detection logic after initial load is complete:
    if(this.initialLoad){
      return;
    }

    //Detect changes in request params from action component (indicates new search):
    const currentParamsStr = JSON.stringify(this.sharedProp.params);
    const previousParamsStr = JSON.stringify(this.previousParams);
    
    if(currentParamsStr !== previousParamsStr){
      //Params changed - set loading to true:
      this.loading = true;
      //Update previous params to current state:
      this.previousParams = JSON.parse(currentParamsStr);
      return; //Exit to avoid checking response in same cycle
    }

    //Detect changes in response (indicates data received):
    if(this.sharedFunctions.response !== this.previousResponse){
      //Update previous response reference:
      this.previousResponse = this.sharedFunctions.response;
      
      //If response is not null/false, data has arrived - disable loading:
      if(this.sharedFunctions.response){
        this.loading = false;
      }
    }
  }

  mailDelivery(current_appointment: any){
    //Open dialog to display downloadable files:
    this.sharedFunctions.openDialog('mail_delivery', current_appointment);
  }
}
