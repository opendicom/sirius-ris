import { Component, OnInit, DoCheck, ViewChild, ElementRef } from '@angular/core';

//--------------------------------------------------------------------------------------------------------------------//
// IMPORTS:
//--------------------------------------------------------------------------------------------------------------------//
import { ActivatedRoute } from '@angular/router';                                           // Activated Route Interface
import { SharedPropertiesService } from '@shared/services/shared-properties.service';       // Shared Properties
import { SharedFunctionsService } from '@shared/services/shared-functions.service';         // Shared Functions
import { I18nService } from '@shared/services/i18n.service';                                // I18n Service
import { ISO_3166, regexObjectId } from '@env/environment';                                                // Enviroments
//--------------------------------------------------------------------------------------------------------------------//

@Component({
  selector: 'app-details',
  templateUrl: './details.component.html',
  styleUrls: ['./details.component.css']
})
export class DetailsComponent implements OnInit, DoCheck {
  //Set component properties:
  public country_codes: any = ISO_3166;

  //Set visible columns of the list:
  public displayedColumns: string[] = ['element_action', 'date', 'documents', 'names', 'surnames', 'room_place'];

  //Set loading state:
  public loading: boolean = false;
  public noBoards: boolean = false;
  private initialLoad: boolean = true;
  private previousParams: any;
  private previousResponse: any;

  //Table to XLSX (SheetJS CE):
  private excludedColumns = [this.i18n.instant('BOARDS.LIST.TABLE.ACTIONS')];
  @ViewChild('main_list') table!: ElementRef;
  tableToExcel(): void { this.sharedFunctions.tableToXLSX(this.i18n.instant('CHECK-IN-BOARDS.DETAILS.SHEET_NAME'), this.table, this.excludedColumns) }

  //Inject services to the constructor:
  constructor(
    private objRoute: ActivatedRoute,
    public sharedProp: SharedPropertiesService,
    public sharedFunctions: SharedFunctionsService,
    private i18n: I18nService
  ){
    //Get Logged User Information:
    this.sharedProp.userLogged = this.sharedFunctions.getUserInfo();

    //Set action properties:
    sharedProp.actionSetter({
      content_title       : this.i18n.instant('CHECK-IN-BOARDS.DETAILS.TITLE'),
      content_icon        : 'monitor',
      add_button          : false,
      duplicated_surnames : false,        // Check duplicated surnames
      nested_element      : false,        // Set nested element
      filters_form        : true,
      filters : {
        search        : true,
        date          : 'date',           // Field name in schema
        date_range    : false,
        urgency       : false,
        status        : false,
        flow_state    : false,
        modality      : false,
        board         : 'fk_board',       // FK name in schema
        fk_user       : false,
        log_event     : false,
        pager         : true,
        clear_filters : false
      },
      advanced_search : false
    });

    //Set element:
    sharedProp.elementSetter('check_in_boards');

    //Initialize action fields:
    this.sharedProp.filter        = '';
    this.sharedProp.urgency       = '';
    this.sharedProp.status        = '';
    this.sharedProp.flow_state    = '';
    this.sharedProp.date          = new Date();
    this.sharedProp.date_range    = {
      start : '',
      end   : ''
    };
    this.sharedProp.modality      = '';
    this.sharedProp.board         = '';
    this.sharedProp.boards        = [];
    this.sharedProp.fk_user       = '';
    this.sharedProp.log_event     = '';
    this.sharedProp.log_element   = '';

    //Initialize selected items:
    this.sharedProp.selected_items = [];
    this.sharedProp.checked_items = [];

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
      'date': 1,
      'fk_board': 1,
      'room_place': 1,
      'patient.person.documents': 1,
      'patient.person.name_01': 1,
      'patient.person.name_02': 1,
      'patient.person.surname_01': 1,
      'patient.person.surname_02': 1
    };
    this.sharedProp.sort          = { 'date': 1 };
    this.sharedProp.pager         = { page_number: 1, page_limit: this.sharedProp.mainSettings.appSettings.default_page_sizes[0] };
    this.sharedProp.group         = false;

    //Refresh request params:
    sharedProp.paramsRefresh();
  }

  //Current board (General information of the details):
  get currentBoard(): any {
    return this.sharedProp.boards.find((current: any) => current._id === this.sharedProp.board);
  }

  ngOnInit(): void {
    this.loading = true;
    this.setAvailableBoards();
  }

  //--------------------------------------------------------------------------------------------------------------------//
  // SET AVAILABLE BOARDS:
  // The backend scopes boards to the domain of the logged user (JWT), so only the allowed ones are received.
  //--------------------------------------------------------------------------------------------------------------------//
  setAvailableBoards(): void {
    //Find active boards (Response is not saved to preserve the list response):
    this.sharedFunctions.find('boards', { 'filter[status]': true, 'proj[_id]': 1, 'proj[name]': 1, 'proj[branch.short_name]': 1, 'proj[organization.short_name]': 1, 'sort[name]': 1 }, (res) => {
      //Check result:
      if(res.success === true && res.data.length > 0){
        //Set available boards and current board (Parameters by routing :_id [fk_board], first match if it is not a valid ObjectId):
        this.sharedProp.boards = res.data;
        const routeBoard = this.objRoute.snapshot.params['_id'];
        this.sharedProp.board = regexObjectId.test(routeBoard) ? routeBoard : res.data[0]._id;

        //Refresh request params to preserve board filter:
        this.sharedProp.paramsRefresh();

        //First search (List):
        this.sharedFunctions.find(this.sharedProp.element, this.sharedProp.params, (resCheckInBoards) => {
          //Set loading to false when data is received:
          this.loading = false;

          //Initialize base state for change detection after initial load:
          this.previousParams = JSON.parse(JSON.stringify(this.sharedProp.params));
          this.previousResponse = this.sharedFunctions.response;

          //Mark initial load as complete:
          this.initialLoad = false;
        });

      } else {
        //No boards available for the logged user:
        this.noBoards = true;
        this.loading = false;
      }
    }, false, false, false);
  }
  //--------------------------------------------------------------------------------------------------------------------//

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
}
