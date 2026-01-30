import { Component, OnInit, DoCheck, ViewChild, ElementRef } from '@angular/core';

//--------------------------------------------------------------------------------------------------------------------//
// IMPORTS:
//--------------------------------------------------------------------------------------------------------------------//
import { SharedPropertiesService } from '@shared/services/shared-properties.service';             // Shared Properties
import { SharedFunctionsService } from '@shared/services/shared-functions.service';               // Shared Functions
import { I18nService } from '@shared/services/i18n.service';                                      // I18n Service
import { ISO_3166, objectKeys } from '@env/environment';                                          // Enviroments
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

  //Loading state management:
  public loading: boolean = false;
  private initialLoad: boolean = true;
  private previousParams: any;
  private previousResponse: any;

  //Table to XLSX (SheetJS CE):
  private excludedColumns = [this.i18n.instant('CHECK-IN.LIST.ACTIONS')];
  @ViewChild('main_list') table!: ElementRef;
  tableToExcel(): void { this.sharedFunctions.tableToXLSX(this.i18n.instant('CHECK-IN.LIST.TITLE'), this.table, this.excludedColumns) }

  //Re-define method in component to use in HTML view:
  public getKeys: any;

  //Set visible columns of the list:
  public displayedColumns: string[] = [
    'order',
    'element_action',
    'schedule',
    'documents',
    'names',
    'surnames',
    'patient_age',
    'gender',
    'height',
    'weight',
    'details',
    'private_health',
    'wait_time',
    'outpatient_inpatient',
    'urgency'
  ];

  //Inject services to the constructor:
  constructor(
    public sharedProp: SharedPropertiesService,
    public sharedFunctions: SharedFunctionsService,
    private i18n: I18nService
  ){
    //Pass Service Method:
    this.getKeys = this.sharedFunctions.getKeys;

    //Get Logged User Information:
    this.sharedProp.userLogged = this.sharedFunctions.getUserInfo();

    //Set action properties:
    sharedProp.actionSetter({
      content_title       : this.i18n.instant('CHECK-IN.LIST.TITLE'),
      content_icon        : 'today',
      add_button          : false,
      duplicated_surnames : true,         // Check duplicated surnames
      nested_element      : 'performing', // Set nested element
      filters_form        : true,
      filters : {
        search        : true,
        date          : 'start-end',
        date_range    : false,
        urgency       : false,
        status        : false,
        flow_state    : false,
        modality      : 'modality._id', //FK name in schema
        fk_user       : false,
        log_event     : false,
        pager         : false,
        clear_filters : false
      },
      advanced_search : false
    });

    //Set element:
    sharedProp.elementSetter('appointments');

    //Initialize action fields:
    this.sharedProp.filter        = '';
    this.sharedProp.urgency       = '';
    this.sharedProp.flow_state    = 'A01';
    this.sharedProp.status        = 'true';
    this.sharedProp.date          = new Date();
    this.sharedProp.date_range    = {
      start : '',
      end   : '',
    };
    this.sharedProp.modality      = '';
    this.sharedProp.fk_user       = '';
    this.sharedProp.log_event     = '';
    this.sharedProp.log_element   = '';

    //Set initial request params:
    this.sharedProp.regex         = 'true';
    this.sharedProp.filterFields  = [
      'patient.person.documents.document',
      'patient.person.name_01',
      'patient.person.name_02',
      'patient.person.surname_01',
      'patient.person.surname_02'
    ];
    this.sharedProp.projection    = {
      'start': 1,
      'end': 1,
      'accession_date': 1,
      'flow_state': 1,
      'outpatient': 1,
      'inpatient': 1,
      'patient': 1,
      'urgency': 1,
      'slot.equipment.name': 1,
      'slot.equipment.AET': 1,
      'procedure.name': 1,
      'procedure.code': 1,
      'procedure.coefficient': 1,
      'procedure.wait_time': 1,
      'private_health': 1,
      'contrast'             : 1
    };
    this.sharedProp.sort          = { 'start': 1 };
    this.sharedProp.pager         = { page_number: 1, page_limit: this.sharedProp.mainSettings.appSettings.check_in_default_size };
    this.sharedProp.group         = false;

    //Refresh request params:
    sharedProp.paramsRefresh();
  }

  ngOnInit(): void {
    this.loading = true;
    this.setDefaultModality();
  }

  setDefaultModality(){
    let element = 'modalities';
    let params : any = { 'filter[status]': true, 'proj[_id]': 1, 'proj[code_value]': 1 };
    let findOne = true;

    //Check if the user is logged in at the service level:
    if(this.sharedProp.userLogged.permissions[0].type === 'service'){
      element = 'services';
      params  = { 'filter[_id]': this.sharedProp.userLogged.permissions[0].domain, 'proj[modality]': 1 };
      findOne = false;
    }

    //Find and set default modality:
    this.sharedFunctions.find(element, params, (res) => {
      //Check result:
      if(res.success === true){

        //Check if the user is logged in at the service level:
        switch(element){
          case 'modalities':
            //Set default Modality (First match - findOne):
            this.sharedProp.modality = res.data[0]._id;

            //Set current code value (To filter PET-CT cases):
            this.sharedProp.current_modality_code_value = res.data[0].code_value;
            break;

          case 'services':
            //Set default Modality (First match - findOne):
            this.sharedProp.modality = res.data[0].modality._id;

            //Set current code value (To filter PET-CT cases):
            this.sharedProp.current_modality_code_value = res.data[0].modality.code_value;
            break;
        }

        //Refresh request params to preserve appointments params:
        this.sharedProp.paramsRefresh();

        //First search (List):
        this.sharedFunctions.find(this.sharedProp.element, this.sharedProp.params, async (res) => {
          //Check operation status:
          if(res.success === true){
            //Count duplicated surnames:
            this.sharedProp.duplicatedSurnamesController = await this.sharedFunctions.duplicatedSurnames(res);

            //Find nested elements (Inverse reference | No aggregation cases):
            if(this.sharedProp.action.nested_element){ this.sharedFunctions.findNestedElements(res, this.sharedProp.action.nested_element); }

            //Set loading to false when data is received:
            this.loading = false;

            //Initialize base state for change detection after initial load:
            this.previousParams = JSON.parse(JSON.stringify(this.sharedProp.params));
            this.previousResponse = this.sharedFunctions.response;

            //Mark initial load as complete:
            this.initialLoad = false;
          }
        });

      } else {
        //Send message:
        this.sharedFunctions.sendMessage(this.i18n.instant('CHECK-IN.LIST.DEFAULT-MODALITY-ERROR'));
      }
    }, findOne);
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
      return;
    }
    if(this.sharedFunctions.response !== this.previousResponse){
      this.previousResponse = this.sharedFunctions.response;
      if(this.sharedFunctions.response){
        //Response received - mark loading as complete:
        this.loading = false;
      }
    }
  }

  mwlResend(fk_appointment: string, accession_date: string){
    //Create operation handler:
    const operationHandler = {
      accession_date  : accession_date
    };

    //Open dialog to decide what operation to perform:
    this.sharedFunctions.openDialog('mwl_resend', operationHandler, (result) => {
      //Check if result is true:
      if(result){
        this.sharedFunctions.sendToMWL(fk_appointment, true, { element: this.sharedProp.element, params: this.sharedProp.params });
      }
    });
  }

  matchIN(object: any, fk_name: string, _id: string){
    return object.filter((currentNested: { [x: string]: string; }) => {
      return currentNested[fk_name] === _id
    })
  }

  //Re-define method in component to prefent error:
  //ngFor key.toString() -> Object is of type 'unknown'.
  toString(element: any){
    return element.toString();
  }
}
