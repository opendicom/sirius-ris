import { Component, OnInit } from '@angular/core';

//--------------------------------------------------------------------------------------------------------------------//
// IMPORTS:
//--------------------------------------------------------------------------------------------------------------------//
import { Router } from '@angular/router';                                                   // Router
import { SharedPropertiesService } from '@shared/services/shared-properties.service';       // Shared Properties
import { SharedFunctionsService } from '@shared/services/shared-functions.service';         // Shared Functions
import { AppointmentsService } from '@modules/appointments/services/appointments.service';  // Appointments service
import {                                                                                    // Enviroment
  appointments_flow_states,
  appointment_requests_flow_states,
  performing_flow_states,
  events_log
} from '@env/environment';
//--------------------------------------------------------------------------------------------------------------------//

@Component({
  selector: 'app-action',
  templateUrl: './action.component.html',
  styleUrls: ['./action.component.css']
})
export class ActionComponent implements OnInit {
  public page_sizes           : any = this.sharedProp.mainSettings.appSettings.default_page_sizes;
  public eventsLog            : any = events_log;
  public number_of_pages      : any = [1];
  public flow_states          : any = {
    appointments          : appointments_flow_states,
    appointment_requests  : appointment_requests_flow_states,
    performing            : performing_flow_states,
    reports               : performing_flow_states //Advanced search case.
  };

  //Set DB action properties:
  public modalities : any;
  public availableOrganizations: any;

  //Initializate nestedIN:
  public nestedIN   : string[] = [];

  //Inject services to the constructor:
  constructor(
    private router              : Router,
    public sharedProp           : SharedPropertiesService,
    public sharedFunctions      : SharedFunctionsService,
    public appointmentsService  : AppointmentsService
  ) {
    //Set action properties:
    sharedProp.actionSetter({
      content_title   : false,
      filters_form    : false,
    });

    //Initialize filter param (empty):
    this.sharedProp.filter = '';
  }

  ngOnInit(): void {
    //Find DB action properties:
    this.findModalities();
    this.findOrganizations();

    //Get Logged User Information (Domain and domain type):
    const domain = this.sharedProp.userLogged.permissions[0].domain;
    const domainType = this.sharedProp.userLogged.permissions[0].type;

    //Set current organization (To filter by pathologies):
    this.sharedFunctions.getLoggedOrganization(domain, domainType, (result) => {
      //Set organization in shared properties:
      this.sharedProp.current_organization = result;

      //First find Pathologies:
      this.sharedFunctions.findPathologies(result, (resPathologies) => {
        this.sharedProp.availablePathologies = [... resPathologies];
        this.sharedProp.filteredPathologies = [... resPathologies];
      });
    });
  }

  //--------------------------------------------------------------------------------------------------------------------//
  // ON SEARCH:
  //--------------------------------------------------------------------------------------------------------------------//
  async onSearch(page: number = 1, clear: boolean = false, saveResponse: boolean = true){
    //Check clear filters:
    if(clear){
      //Initialize action fields:
      this.sharedProp.filter = '';
      this.sharedProp.status = '';
      this.sharedProp.urgency = '';
      this.sharedProp.flow_state = '';
      this.sharedProp.pager.page_number = 1;
      this.sharedProp.pager.page_limit = this.page_sizes[0];
      this.sharedProp.date = '';
      this.sharedProp.date_range = {
        start : '',
        end   : ''
      };
      this.sharedProp.modality = '';
      this.sharedProp.fk_user = '';
      this.sharedProp.log_event = '';
      this.sharedProp.log_element = '';

      //Initialize duplicated surnames controller:
      this.sharedProp.duplicatedSurnamesController = {
        repeatedSurnames  : {},
        allSurnames       : [],
      }

      //Check group:
      if(this.sharedProp.group !== undefined && this.sharedProp.group !== null && this.sharedProp.group !== '' && this.sharedProp.group !== 'false' && this.sharedProp.group !== false){
        //Do nothing -> Preserve group params.
      } else {
        this.sharedProp.group = false;
      }

      //Check location by URL (Only advanced search cases):
      if(this.router.url.split('/')[1] == 'advanced-search'){
        //Initialize advanced search params (Clone with spread operator):
        this.sharedProp.advanced_search = { ... this.sharedProp.default_advanced_search };

        //Reset pathologies params:
        this.sharedProp.pathologies_input = '';
        this.sharedProp.advanced_search.pathologies = [];

        //Refresh Pathologies:
        this.sharedFunctions.findPathologies(this.sharedProp.current_organization, (resPathologies) => {
          this.sharedProp.availablePathologies = [... resPathologies];
          this.sharedProp.filteredPathologies = [... resPathologies];
        });
      }
    }

    //Initialize selected items:
    this.sharedProp.selected_items = [];
    this.sharedProp.checked_items = [];

    //Set page:
    if(page >= 1){
      this.sharedProp.pager.page_number = page;
    } else {
      //Set default page:
      this.sharedProp.pager.page_number = 1;
    }

    //Refresh request params:
    await this.sharedProp.paramsRefresh();

    //Find:
    this.sharedFunctions.find(this.sharedProp.element, this.sharedProp.params, async (res) => {
      //Check operation status:
      if(res.success === true){
        //Check if duplicate surnames check is required:
        if(this.sharedProp.action.duplicated_surnames === true){
          //Count duplicated surnames:
          this.sharedProp.duplicatedSurnamesController = await this.sharedFunctions.duplicatedSurnames(res);
        }

        //Check if it is the performing list to find the authenticated ones:
        if(this.sharedProp.element === 'performing' && this.sharedProp.action.content_title === 'Listado de estudios'){
          this.sharedFunctions.getAuthenticated(res.data);
        }

        //Find nested elements (Inverse reference | No aggregation cases):
        if(this.sharedProp.action.nested_element){ this.sharedFunctions.findNestedElements(res, this.sharedProp.action.nested_element); }
      }
    },false, false, saveResponse);
  }
  //--------------------------------------------------------------------------------------------------------------------//


  //--------------------------------------------------------------------------------------------------------------------//
  // SET PAGE LIMIT:
  //--------------------------------------------------------------------------------------------------------------------//
  setPageLimit(limit: number = this.page_sizes[0]): void{
    if(limit >= 0){
      this.sharedProp.pager.page_limit = limit;
      this.onSearch(this.sharedProp.pager.page_number);
    }
  }
  //--------------------------------------------------------------------------------------------------------------------//


  //--------------------------------------------------------------------------------------------------------------------//
  // PREV & NEXT PAGE:
  //--------------------------------------------------------------------------------------------------------------------//
  nextPage(pager: any): void {
    if(pager.actual_page > 0 && pager.actual_page < pager.number_of_pages){
      this.onSearch(pager.actual_page + 1);
    }
  }

  prevPage(pager: any): void{
    if(pager.actual_page >= 1){
      this.onSearch(pager.actual_page - 1);
    }
  }
  //--------------------------------------------------------------------------------------------------------------------//


  //--------------------------------------------------------------------------------------------------------------------//
  // COUNTER PAGES:
  //--------------------------------------------------------------------------------------------------------------------//
  counterPages(number_of_pages: number): Array<number> {
    return Array.from({length: number_of_pages}, (_, i) => i + 1);
  }
  //--------------------------------------------------------------------------------------------------------------------//


  //--------------------------------------------------------------------------------------------------------------------//
  // DELETE SELECTED ITEMS:
  //--------------------------------------------------------------------------------------------------------------------//
  deleteSelectedItems(){
    //Create operation handler:
    const operationHandler = {
      element         : this.sharedProp.element,
      selected_items  : this.sharedProp.selected_items,
      router          : this.router
    }

    //Open dialog to confirm:
    this.sharedFunctions.openDialog('delete', operationHandler);
  }
  //--------------------------------------------------------------------------------------------------------------------//


  //--------------------------------------------------------------------------------------------------------------------//
  // FIND MODALITIES:
  //--------------------------------------------------------------------------------------------------------------------//
  findModalities(){
    this.sharedFunctions.find('modalities', { 'filter[status]': true }, (res) => {
      //Check result:
      if(res.success === true){
        this.modalities = res.data;
      }
    })
  }
  //--------------------------------------------------------------------------------------------------------------------//


  //--------------------------------------------------------------------------------------------------------------------//
  // SET CURRENT CODE VALUE:
  //--------------------------------------------------------------------------------------------------------------------//
  setCurrentCodeValue(code_value: string){
    //Set current code value (To filter PET-CT cases):
    this.sharedProp.current_modality_code_value = code_value;
  }
  //--------------------------------------------------------------------------------------------------------------------//


  //--------------------------------------------------------------------------------------------------------------------//
  // SET REPORTING USER:
  //--------------------------------------------------------------------------------------------------------------------//
  setReportingUser(){
    //Set reporting user:
    this.sharedProp.fk_user = this.sharedProp.userLogged.user_id;

    //Find:
    this.onSearch();
  }
  //--------------------------------------------------------------------------------------------------------------------//


  //--------------------------------------------------------------------------------------------------------------------//
  // FIND ORGANIZATIONS:
  //--------------------------------------------------------------------------------------------------------------------//
  findOrganizations(){
    //Set params:
    const params = { 'filter[status]': true };

    //Find organizations:
    this.sharedFunctions.find('organizations', params, (res) => {
      this.availableOrganizations = res.data;
    });
  }
  //--------------------------------------------------------------------------------------------------------------------//


  //--------------------------------------------------------------------------------------------------------------------//
  // ON CHANGE ORGANIZATION:
  //--------------------------------------------------------------------------------------------------------------------//
  onChangeOrganization(event: any){
    this.sharedFunctions.findPathologies(event.value, (resPathologies) => {
      this.sharedProp.availablePathologies = [... resPathologies];
      this.sharedProp.filteredPathologies = [... resPathologies];
    });
  }
  //--------------------------------------------------------------------------------------------------------------------//

  //--------------------------------------------------------------------------------------------------------------------//
  // Advanced Search Clear:
  //--------------------------------------------------------------------------------------------------------------------//
  async advancedSearchClear(){
    await this.onSearch(1, true, false);
    this.sharedFunctions.response = false;
  }
  //--------------------------------------------------------------------------------------------------------------------//

  //--------------------------------------------------------------------------------------------------------------------//
  // PATHOLOGIES MANAGEMENT:
  //--------------------------------------------------------------------------------------------------------------------//
  filterPathologies(event: any){
    //Set filter value and to upper case:
    const filterValue = event.srcElement.value.toUpperCase();

    //Filter pathologies:
    this.sharedProp.filteredPathologies = this.sharedProp.availablePathologies.filter(option => option.name.toUpperCase().includes(filterValue));
  }

  addPathology(currentPathology: any){
    //Add current pathology into selected pathologies array (check duplicates):
    if(this.sharedProp.advanced_search.pathologies.filter((element: any) => element._id === currentPathology._id).length <= 0){
      this.sharedProp.advanced_search.pathologies.push(currentPathology);
    }

    //Remove currentPathology from availablePathologies:
    this.sharedFunctions.removeItemFromArray(this.sharedProp.availablePathologies, currentPathology);

    //Clear pathologies input:
    this.sharedProp.pathologies_input = '';
    
    //Clear filter pathologies:
    this.filterPathologies({ srcElement : { value: '' } });
  }

  removePathology(currentPathology: any){
    //Remove current Pathology from selected pathologies:
    this.sharedFunctions.removeItemFromArray(this.sharedProp.advanced_search.pathologies, currentPathology);

    //Add removed pathology into availablePathologies and filteredPathologies (check duplicates):
    if(this.sharedProp.availablePathologies.filter(element => element._id === currentPathology._id).length <= 0){
      this.sharedProp.availablePathologies.push(currentPathology);
    }
    
    //Clear pathologies input:
    this.sharedProp.pathologies_input = '';

    //Clear filter pathologies:
    this.filterPathologies({ srcElement : { value: '' } });
  }
  //--------------------------------------------------------------------------------------------------------------------//
}
