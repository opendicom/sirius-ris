import { Component, OnInit } from '@angular/core';

//--------------------------------------------------------------------------------------------------------------------//
// IMPORTS:
//--------------------------------------------------------------------------------------------------------------------//
import { Router } from '@angular/router';                                               // Router
import { SharedPropertiesService } from '@shared/services/shared-properties.service';   // Shared Properties
import { SharedFunctionsService } from '@shared/services/shared-functions.service';     // Shared Functions
import { default_page_sizes, regexObjectId } from '@env/environment';                   // Enviroment
//--------------------------------------------------------------------------------------------------------------------//

@Component({
  selector: 'app-action',
  templateUrl: './action.component.html',
  styleUrls: ['./action.component.css']
})
export class ActionComponent implements OnInit {
  public page_sizes: any = default_page_sizes;
  public number_of_pages = [1];

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

  ngOnInit(): void { }

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
      this.sharedProp.pager.page_number = 1;
      this.sharedProp.pager.page_limit = this.page_sizes[0];
      this.sharedProp.date_range = {
        start : '',
        end   : ''
      };
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
  // RESUME  APPOINTMENT DRAFT:
  //--------------------------------------------------------------------------------------------------------------------//
  resumeAppointmentDraft(_id: string){
    //Check if element is not empty:
    if(_id !== '' && _id !== undefined && _id !== null && regexObjectId.test(_id)){
      //Request params:
      const params = {
        'filter[_id]': _id,

        //Projection:
        'proj[start]': 1,
        'proj[end]': 1,
        'proj[urgency]': 1,

        //Projection - Patient:
        'proj[patient._id]': 1,
        'proj[patient.fk_person]': 1,
        'proj[patient.status]': 1,

        //Projection - Patient -> Person:
        'proj[patient.person._id]': 1,
        'proj[patient.person.documents]': 1,
        'proj[patient.person.name_01]': 1,
        'proj[patient.person.name_02]': 1,
        'proj[patient.person.surname_01]': 1,
        'proj[patient.person.surname_02]': 1,
        'proj[patient.person.birth_date]': 1,
        'proj[patient.person.gender]': 1,

        //Projection - Imaging:
        'proj[imaging.organization._id]': 1,
        'proj[imaging.organization.short_name]': 1,
        'proj[imaging.branch._id]': 1,
        'proj[imaging.branch.short_name]': 1,
        'proj[imaging.service._id]': 1,
        'proj[imaging.service.name]': 1,

        //Projection - Modality:
        'proj[modality._id]': 1,
        'proj[modality.code_meaning]': 1,
        'proj[modality.code_value]': 1,

        //Projection - Procedure:
        'proj[procedure]': 1,

        //Projection - Slot:
        'proj[slot._id]': 1,

        //Projection - Slot -> Equipment:
        'proj[slot.equipment.name]': 1,
        'proj[slot.equipment.AET]': 1
      };

      //Find corrdinations in progress:
      this.sharedFunctions.find('appointments_drafts', params, (res) => {
        //Check operation status:
        if(res.success === true){
          //Set sharedProp current data:
          //Current Patient:
          this.sharedProp.current_patient = {
            _id       : res.data[0].patient._id,
            status    : res.data[0].patient.status,
            fk_person : res.data[0].patient.fk_person,
            person    : res.data[0].patient.person
          };

          //Current Imaging:
          this.sharedProp.current_imaging = res.data[0].imaging;

          //Current Modality:
          this.sharedProp.current_modality = res.data[0].modality;

          //Current Procedure:
          this.sharedProp.current_procedure = res.data[0].procedure;

          //Current Slot:
          this.sharedProp.current_slot = res.data[0].slot._id;

          //Current Equipment:
          this.sharedProp.current_equipment = {
            details: {
              name  : res.data[0].slot.equipment.name,
              AET   : res.data[0].slot.equipment.AET
            }
          };

          //Current Datetime:
          this.sharedProp.current_datetime = this.sharedFunctions.datetimeFulCalendarFormater(new Date(res.data[0].start), new Date(res.data[0].end));

          //Current Urgency:
          this.sharedProp.current_urgency = res.data[0].urgency;

          //Redirect to appointments  form-insert:
          this.router.navigate(['/appointments/form/insert']);

        } else {
          //Send error message:
          this.sharedFunctions.sendMessage('Error al intentar editar el elemento con _id: ' + _id  + ' Contactese con su administrador para ver más detalles.');
        }
      }, true);
    }
  }
  //--------------------------------------------------------------------------------------------------------------------//


  //--------------------------------------------------------------------------------------------------------------------//
  // DELETE APPOINTMENT DRAFT:
  //--------------------------------------------------------------------------------------------------------------------//
  deleteAppointmentsDrafts(appointment_draft: any){
    //Create operation handler:
    const operationHandler = {
      element           : 'appointments_drafts',
      appointment_draft : appointment_draft
    }

    //Open dialog to confirm:
    this.sharedFunctions.openDialog('delete_appointment_draft', operationHandler, (res) => {
      //Reload a component:
      this.router.routeReuseStrategy.shouldReuseRoute = () => false;
      this.router.onSameUrlNavigation = 'reload';

      //Redirect to list element:
      this.router.navigate(['/appointments/list']);
    });
  }
  //--------------------------------------------------------------------------------------------------------------------//
}
