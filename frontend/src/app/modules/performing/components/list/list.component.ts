import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';

//--------------------------------------------------------------------------------------------------------------------//
// IMPORTS:
//--------------------------------------------------------------------------------------------------------------------//
import { ActivatedRoute } from '@angular/router';                                               // Activated Route Interface
import { SharedPropertiesService } from '@shared/services/shared-properties.service';           // Shared Properties
import { SharedFunctionsService } from '@shared/services/shared-functions.service';             // Shared Functions
import {                                                                                        // Enviroments
  regexObjectId,
  ISO_3166
} from '@env/environment';
import { I18nService } from '@shared/services/i18n.service';                                  // I18n Service
//--------------------------------------------------------------------------------------------------------------------//

@Component({
  selector: 'app-list',
  templateUrl: './list.component.html',
  styleUrls: ['./list.component.css']
})
export class ListComponent implements OnInit {
  //Set component properties:
  public country_codes          : any = ISO_3166;
  public documentTypesKeys      : string[] = ['1','2','3','4','5','6','7','100'];

  //Table to XLSX (SheetJS CE):
  private excludedColumns = [this.i18n.instant('PERFORMING.LIST.EXCLUDED_COLUMNS_XLSX').split(',')[0]];
  @ViewChild('main_list') table!: ElementRef;
  tableToExcel(): void { this.sharedFunctions.tableToXLSX(this.i18n.instant('PERFORMING.LIST.EXCEL_SHEET_NAME'), this.table, this.excludedColumns) }

  //Set visible columns of the list:
  public displayedColumns: string[] = [
    'report_indicator',
    'element_action',
    'flow_state',
    'date',
    'report_control',
    'checkin_time',
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
    private i18n            : I18nService
  ){
    //Get Logged User Information:
    this.sharedProp.userLogged = this.sharedFunctions.getUserInfo();

    //Initializate reporting action button (disabled):
    let reporting : boolean | string = false;

    //Enable reporting button if the user is Superuser, Supervisor, Médico:
    if(this.sharedProp.userLogged.permissions[0].role == 1 || this.sharedProp.userLogged.permissions[0].role == 3 || this.sharedProp.userLogged.permissions[0].role == 4){
      reporting = 'appointment.reporting.fk_reporting._id';
    }

    //Set action properties:
    sharedProp.actionSetter({
      content_title       : this.i18n.instant('PERFORMING.LIST.TITLE'),
      content_icon        : 'assignment_ind',
      add_button          : false,
      duplicated_surnames : true,     // Check duplicated surnames
      nested_element      : false,    // Set nested element
      filters_form        : true,
      filters : {
        search        : true,
        date          : false,
        date_range    : 'date',
        urgency       : true,
        status        : true,
        flow_state    : true,
        modality      : 'modality._id',   //FK name in schema
        fk_user       : reporting,
        log_event     : false,
        pager         : true,
        clear_filters : true
      },
      advanced_search : false
    });

    //Set element:
    sharedProp.elementSetter('performing');

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
      'appointment.cancellation_reasons': 1,
      'appointment.outpatient': 1,
      'appointment.inpatient': 1,
      'appointment.report_before': 1,
      'appointment.attached_files._id': 1,    //Only _id and name for performing downloads dialog.
      'appointment.attached_files.name': 1,   //Only _id and name for performing downloads dialog.
      'appointment.study_iuid': 1,
      'fk_appointment': 1,
      'date': 1,
      'flow_state': 1,
      'patient': 1,
      'status': 1,
      'equipment.name': 1,
      'equipment.AET': 1,
      'procedure.name': 1,
      'procedure.code': 1,
      'procedure.reporting_delay': 1,
      'modality': 1,
      'urgency': 1
    };
    this.sharedProp.sort          = { 'date': -1, 'urgency': 1, 'status': -1, 'appointment.imaging.organization._id': 1 };
    this.sharedProp.pager         = { page_number: 1, page_limit: this.sharedProp.mainSettings.appSettings.default_page_sizes[0] };
    this.sharedProp.group         = false;

    //Default the studies assigned to the user to the list (Médico):
    if(this.sharedProp.userLogged.permissions[0].role == 4){
      this.sharedProp.fk_user = this.sharedProp.userLogged.user_id;
    }

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
    this.sharedFunctions.find(this.sharedProp.element, this.sharedProp.params, resPerforming => {
      //Find the authenticated ones:
      this.sharedFunctions.getAuthenticated(resPerforming.data);
    });
  }

  performingDownloads(current_performing: any){
    //Open dialog to display downloadable files:
    this.sharedFunctions.openDialog('performing_downloads', current_performing);
  }

  mailDelivery(current_performing: any){
    //Open dialog to display downloadable files:
    this.sharedFunctions.openDialog('mail_delivery', current_performing);
  }

  dicomAccess(current_performing: any){
    //Open dialog to display DICOM options:
    this.sharedFunctions.openDialog('dicom_access', current_performing);
  }
}
