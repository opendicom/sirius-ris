import { Injectable } from '@angular/core';

//--------------------------------------------------------------------------------------------------------------------//
// IMPORTS:
//--------------------------------------------------------------------------------------------------------------------//
import { UsersAuthService } from '@auth/services/users-auth.service';         // Users Auth Service
import { regexObjectId } from '@env/environment';                             // Enviroments
//--------------------------------------------------------------------------------------------------------------------//

@Injectable({
  providedIn: 'root'
})
export class SharedPropertiesService {
  // mainSettings property is duplicated in the most important services to avoid 
  // circular dependencies and the content is set in the app.component constructor.
  public mainSettings   : any = {};
  public isLogged       : boolean = false;
  public userLogged     : any;
  public action         : any;
  public element        : any;
  public params         : any;

  //Request params:
  public regex          : string;
  public filter         : string;
  public filterFields   : any;
  public projection     : any;
  public sort           : any;
  public group          : any;
  public pager          : any;

  //Advanced search params
  public advanced_search: any;
  public default_advanced_search: any = {
    anamnesis             : '',
    clinical_info         : '',
    procedure_description : '',
    procedure_findings    : '',
    summary               : '',
    pathologies           : [],
    signing_user          : '',
    authenticator_user    : '',
    referring_physician   : ''
  };

  //Action fields:
  public status         : string;
  public urgency        : string;
  public flow_state     : string;
  public date           : any;
  public date_range     : any;
  public modality       : any;
  public selected_items : string[];
  public checked_items  : boolean[];
  public fk_user        : string;
  public log_event      : string;
  public log_element    : string | any[];

  //Duplicated surnames controller:
  public duplicatedSurnamesController: any = {
    repeatedSurnames  : {},
    allSurnames       : [],
  }

  //Current operation objects:
  public current_id                 : string = '';
  public current_keysWithValues     : Array<string> = [];
  public current_flow_state         : string = '';
  public current_organization       : any; // To be able to add patients permissions.
  public current_patient            : any;
  public current_imaging            : any;
  public current_modality           : any;
  public current_procedure          : any;
  public current_slot               : any;
  public current_equipment          : any;
  public current_datetime           : any;
  public current_urgency            : boolean = false;
  public current_status             : boolean = false;
  public current_appointment_draft  : any;
  public current_study_iuid         : string = '';
  public current_friendly_pass      : string = '';
  public current_appointment        : string = '';
  public current_appointment_request: any;
  public current_overbooking        : boolean = false;

  //Current operation objects for PET-CT cases:
  public current_modality_code_value  : string = '';
  public current_weight               : string = '';
  public current_coefficient          : string = '';
  public recomended_dose              : string = '';

  //Current operation ojects for Advanced search cases:
  public current_signer_users         : any;
  public current_authenticator_users  : any;
  public pathologies_input            : string = '';
  public availablePathologies         : any[] = [];
  public filteredPathologies          : any[] = [];

  //Inject services to the constructor:
  constructor(private userAuth: UsersAuthService) {
    //Initialize filter (empty):
    this.filter       = '';
    this.status       = '';
    this.urgency      = '';
    this.flow_state   = '';
    this.regex        = '';
    this.date         = '';
    this.date_range   = {
      start : '',
      end   : ''
    };
    this.modality     = '';
    this.fk_user      = '';
    this.log_event    = '';
    this.log_element  = '';

    //Initialize selected items:
    this.selected_items = [];
    this.checked_items = [];
  }

  //--------------------------------------------------------------------------------------------------------------------//
  // SHARED PROPERTIES SETTERS:
  //--------------------------------------------------------------------------------------------------------------------//
  actionSetter(properties: any): void {
    this.action = properties;
  }

  checkIsLogged(): void {
    this.isLogged = this.userAuth.userIsLogged();
  }

  isLoggedSetter(isLogged: boolean): void {
    this.isLogged = isLogged;
  }

  elementSetter(element: string): void {
    this.element = element;
  }
  //--------------------------------------------------------------------------------------------------------------------//


  //--------------------------------------------------------------------------------------------------------------------//
  // PARAMS REFRESH:
  //--------------------------------------------------------------------------------------------------------------------//
  async paramsRefresh() {
    let string_regex  : string = '';
    let string_filter : string = '';
    let string_proj   : string = '';
    let string_sort   : string = '';
    let string_group  : string = '';
    let string_pager  : string = '';

    //Adjust params formats:
    //Regex:
    if(this.regex != ''){
      string_regex = '"regex": "' + this.regex + '", ';
    }

    //Check Word Search - Filter (With OR Condition):
    if(this.filter != ''){
      //Check if filter is valid ObjectId:
      if(this.filter !== undefined && regexObjectId.test(this.filter)){
        string_filter += '"filter[and][_id]": "' + this.filter + '", ';

      //Create OR condition for defined filter fields:
      } else {
        for(let key in this.filterFields){
          string_filter += '"filter[or][' + this.filterFields[key] + ']": "' + this.filter + '", ';
        }
      }
    }

    //Check status - Filter (With AND Condition):
    if(this.status === 'true' || this.status === 'false'){
      string_filter += '"filter[and][status]": "' + this.status + '", ';
    }

    //Check urgency - Filter (With AND Condition):
    if(this.urgency === 'true' || this.urgency === 'false'){
      string_filter += '"filter[and][urgency]": "' + this.urgency + '", ';
    }

    //Check flow state - Filter (With AND Condition):
    if(this.flow_state !== ''){
      //Check Advanced search looked up case:
      if(this.element === 'reports'){
        string_filter += '"filter[and][performing.flow_state]": "' + this.flow_state + '", ';
      } else {
        string_filter += '"filter[and][flow_state]": "' + this.flow_state + '", ';
      }
    }

    //Check Modality - Filter (With AND Condition):
    if(this.action.filters_form === true && this.modality !== ''){
      string_filter += '"filter[and][' + this.action.filters.modality + ']": "' + this.modality + '", ';
    }

    //Check Date - Filter (With AND Condition):
    if(this.action.filters_form === true && this.date !== ''){
      string_filter += this.setDateTimeStringFilter(this.date, this.date, this.action.filters.date);
    }

    //Check Date Range - Filter (With AND Condition)::
    if(this.action.filters_form === true && this.date_range.start !== '' && this.date_range.end !== ''){
      string_filter += this.setDateTimeStringFilter(this.date_range.start, this.date_range.end, this.action.filters.date_range);
    }

    //Check fk_user - Filter (With AND Condition):
    if(this.fk_user !== ''){
      string_filter += '"filter[and][' + this.action.filters.fk_user + ']": "' + this.fk_user + '", ';
    }

    //Check log_event - Filter (With AND Condition):
    if(this.log_event !== ''){
      string_filter += '"filter[and][event]": "' + this.log_event + '", ';
    }

    //Check log_element - Filter (With AND Condition):
    if(this.log_element !== ''){
      if(typeof this.log_element == 'string'){
        string_filter += '"filter[and][element._id]": "' + this.log_element + '", ';
      } else {
        //Create string from array of ObjectIds preserving quotes:
        const stringQuotesArray = '["' + this.log_element.join('","') + '"]';
        string_filter += '"filter[in][element._id]": ' + stringQuotesArray + ', ';
      }
    }

    //Projection:
    for(let key in this.projection){
      string_proj += '"proj[' + key + ']": "' + this.projection[key] + '", ';
    }

    //Sort:
    for(let key in this.sort){
      string_sort += '"sort[' + key + ']": "' + this.sort[key] + '", ';
    }

    //Group:
    if(this.group !== undefined && this.group !== null && this.group !== '' && this.group !== 'false' && this.group !== false){
      //Check group id:
      if(this.group.id !== undefined && this.group.id !== null && this.group.id !== ''){
        string_group = '"group[id]": "' + this.group['id'] + '", ';

        //Group order (optional):
        if(this.group.order !== undefined && this.group.order !== null && this.group.order !== ''){
          string_group += '"group[order]": "' + this.group.order + '", ';
        }
      }
    }

    //Advanced search:
    if(this.action.advanced_search !== false){
      //Anamnesis:
      if(this.advanced_search.anamnesis !== undefined && this.advanced_search.anamnesis !== null && this.advanced_search.anamnesis !== ''){
        string_filter += '"filter[and][appointment.anamnesis]": "' + this.advanced_search.anamnesis + '", ';
      }

      //Clinical info:
      if(this.advanced_search.clinical_info !== undefined && this.advanced_search.clinical_info !== null && this.advanced_search.clinical_info !== ''){
        string_filter += '"filter[and][clinical_info]": "' + this.advanced_search.clinical_info + '", ';
      }

      //Procedure description:
      if(this.advanced_search.procedure_description !== undefined && this.advanced_search.procedure_description !== null && this.advanced_search.procedure_description !== ''){
        string_filter += '"filter[and][procedure_description]": "' + this.advanced_search.procedure_description + '", ';
      }

      //Procedure findings:
      if(this.advanced_search.procedure_findings !== undefined && this.advanced_search.procedure_findings !== null && this.advanced_search.procedure_findings !== ''){
        string_filter += '"filter[and][findings.procedure_findings]": "' + this.advanced_search.procedure_findings + '", ';
      }

      //Summary:
      if(this.advanced_search.summary !== undefined && this.advanced_search.summary !== null && this.advanced_search.summary !== ''){
        string_filter += '"filter[and][summary]": "' + this.advanced_search.summary + '", ';
      }

      //Medical signatures:
      if(this.advanced_search.signing_user !== undefined && this.advanced_search.signing_user !== null && this.advanced_search.signing_user !== ''){
        string_filter += '"filter[and][medical_signatures.user._id]": "' + this.advanced_search.signing_user + '", ';
      }

      //Authenticator user:
      if(this.advanced_search.authenticator_user !== undefined && this.advanced_search.authenticator_user !== null && this.advanced_search.authenticator_user !== ''){
        string_filter += '"filter[and][authenticated.user._id]": "' + this.advanced_search.authenticator_user + '", ';
      }

      //Referring physician name and surname:
      if(this.advanced_search.referring_physician !== undefined && this.advanced_search.referring_physician !== null && this.advanced_search.referring_physician !== ''){
        string_filter += '"filter[and][appointment_request.extra.physician_name]": "' + this.advanced_search.referring_physician + '", ';
      }
      
      //Pathologies:
      if(this.advanced_search.pathologies !== undefined && this.advanced_search.pathologies !== null && this.advanced_search.pathologies.length > 0){
        if(this.advanced_search.pathologies.length == 1){
          string_filter += '"filter[and][pathologies._id]": "' + this.advanced_search.pathologies[0]._id + '", ';
        } else {
          //Add all pathologies in ALL condition (await foreach):
          await Promise.all(Object.keys(this.advanced_search.pathologies).map((key: any) =>{
            string_filter += '"filter[all][pathologies._id][' + key + ']": "' + this.advanced_search.pathologies[key]._id + '", ';
          }));
        }
      }
    }

    //Pager:
    string_pager = '"pager[page_number]": "' + this.pager['page_number'] + '", ';
    string_pager += '"pager[page_limit]": "' + this.pager['page_limit'] + '"';

    //Concat string params:
    const string_params = '{ ' + string_regex + string_filter + string_proj + string_sort + string_group + string_pager + ' }';

    //Set params:
    this.params = JSON.parse(string_params);
  }
  //--------------------------------------------------------------------------------------------------------------------//


  //--------------------------------------------------------------------------------------------------------------------//
  // SET DATETIME FORMAT:
  // Duplicated method to prevent circular dependency - [Original method: shared-functions.service].
  //--------------------------------------------------------------------------------------------------------------------//
  _setDatetimeFormat(date: Date, time: string = '00:00'): string{
    //Fix Eastern Daylight Time (TimezoneOffset):
    date.getTimezoneOffset();

    //Separate date:
    const year = date.getFullYear();
    const month = ('0' + (date.getMonth() + 1)).slice(-2);
    const day = ('0' + date.getDate()).slice(-2);

    //Set backend datetime format (string):
    const datetime = year + "-" + month + "-" + day + "T" + time + ":00.000Z";

    //Return formated datetime:
    return datetime;
  }
  //--------------------------------------------------------------------------------------------------------------------//


  //--------------------------------------------------------------------------------------------------------------------//
  // ON CHECK ITEM:
  //--------------------------------------------------------------------------------------------------------------------//
  onCheckItem(event: any, key: string, index: number){
    //Check if it was selected or deselected:
    if(event.checked){
      //Add to selected items array:
      this.checked_items[index] = true;
      this.selected_items.push(key);
    } else {
      //Remove current item from array:
      this.checked_items[index] = false;
      this.selected_items = this.selected_items.filter((item) => item !== key);
    }
  }
  //--------------------------------------------------------------------------------------------------------------------//


  //--------------------------------------------------------------------------------------------------------------------//
  // ON SELECT ALL:
  //--------------------------------------------------------------------------------------------------------------------//
  onSelectAll(event: any){
    //Select list of checkboxes by class:
    const listCheckboxes = document.querySelectorAll('.itemCheck');

    //Initialize index (counter):
    let current_index : number = -1;

    //Loop in checkboxes:
    listCheckboxes.forEach(current => {
      let current_id    : any;
      let hasValue      : boolean = false;

      //Check if MatCheckbox atribute "ng-reflect-value" is not null or undefined:
      if(current.getAttribute('ng-reflect-value') != null || current.getAttribute('ng-reflect-value') != undefined){
        //Set current id:
        current_id = current.getAttribute('ng-reflect-value');
        current_index = current_index + 1;
        hasValue = true;
      } else {
        hasValue = false;
      }

      //Check current element:
      if(hasValue){
        this.onCheckItem(event, current_id, current_index);
      }
    });

    //Remove duplicates from an array:
    this.selected_items = [...new Set(this.selected_items)];
  }
  //--------------------------------------------------------------------------------------------------------------------//


  //--------------------------------------------------------------------------------------------------------------------//
  // GET TOTAL CHECKED:
  //--------------------------------------------------------------------------------------------------------------------//
  getTotalChecked(): number{
    //return the number of true values:
    return this.checked_items.filter(value => value === true).length;
  }
  //--------------------------------------------------------------------------------------------------------------------//


  //--------------------------------------------------------------------------------------------------------------------//
  // SET DATE TIME STRING FILTER:
  //--------------------------------------------------------------------------------------------------------------------//
  setDateTimeStringFilter(date_start: any, date_end: any, action_filters: any): string{
    //Initialize result:
    let result = '';

    //Set Datetime format:
    const start = this._setDatetimeFormat(date_start);
    let end = this._setDatetimeFormat(date_end, '23:59');

    //Check if datetipe is not empty:
    if(action_filters != ''){
      switch(action_filters){
        case 'start-end':
          //Add date range into filter:
          result += '"filter[and][start][$gte]": "' + start + '", ';
          result += '"filter[and][end][$lte]": "' + end + '", ';
          break;
        default:
          //Add date range into filter:
          result += '"filter[and][' + action_filters + '][$gte]": "' + start + '", ';
          result += '"filter[and][' + action_filters + '][$lte]": "' + end + '", ';
          break;
      }
    }

    //Return result:
    return result;
  }
  //--------------------------------------------------------------------------------------------------------------------//
}
