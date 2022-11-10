import { Component, OnInit } from '@angular/core';

//--------------------------------------------------------------------------------------------------------------------//
// IMPORTS:
//--------------------------------------------------------------------------------------------------------------------//
import { Router } from '@angular/router';                                               // Router
import { SharedPropertiesService } from '@shared/services/shared-properties.service';   // Shared Properties
import { SharedFunctionsService } from '@shared/services/shared-functions.service';     // Shared Functions
import { app_setting, appointments_flow_states } from '@env/environment';               // Enviroment
//--------------------------------------------------------------------------------------------------------------------//

@Component({
  selector: 'app-action',
  templateUrl: './action.component.html',
  styleUrls: ['./action.component.css']
})
export class ActionComponent implements OnInit {
  public page_sizes           : any = app_setting.default_page_sizes;
  public number_of_pages      : any = [1];
  public appointmentsFS       : any = appointments_flow_states;

  //Set DB action properties:
  public modalities : any;

  //Inject services to the constructor:
  constructor(
    private router: Router,
    public sharedProp: SharedPropertiesService,
    public sharedFunctions: SharedFunctionsService
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
  }

  //--------------------------------------------------------------------------------------------------------------------//
  // ON SEARCH:
  //--------------------------------------------------------------------------------------------------------------------//
  onSearch(page: number = 1, clear: boolean = false): void{
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
    this.sharedProp.paramsRefresh();

    //Find:
    this.sharedFunctions.find(this.sharedProp.element, this.sharedProp.params);
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
}
