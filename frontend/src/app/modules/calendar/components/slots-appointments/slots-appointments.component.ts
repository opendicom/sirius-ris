import { Component, OnInit, ViewChild } from '@angular/core';

//--------------------------------------------------------------------------------------------------------------------//
// IMPORTS:
//--------------------------------------------------------------------------------------------------------------------//
import { FormGroup, FormBuilder } from '@angular/forms';                                    // Reactive form handling tools
import { SharedPropertiesService } from '@shared/services/shared-properties.service';       // Shared Properties
import { SharedFunctionsService } from '@shared/services/shared-functions.service';         // Shared Functions
import { map, mergeMap, filter } from 'rxjs/operators';                                     // Reactive Extensions (RxJS)
import { FullCalendarComponent, CalendarOptions } from '@fullcalendar/angular';             // FullCalendar Options
import esLocale from '@fullcalendar/core/locales/es';                                       // FullCalendar ES Locale
//--------------------------------------------------------------------------------------------------------------------//

@Component({
  selector: 'app-slots-appointments',
  templateUrl: './slots-appointments.component.html',
  styleUrls: ['./slots-appointments.component.css']
})
export class SlotsAppointmentsComponent implements OnInit {
  //Set references objects:
  public availableOrganizations: any;
  public availableBranches: any;
  public availableServices: any;

  //Re-define method in component to use in HTML view:
  public getKeys: any;

  //Min and max dates:
  public minDate: Date = new Date();
  public maxDate: Date = new Date();

  //Set params objects:
  private slotsParams               : any;
  private appointmentsParams        : any;
  private appointmentsDraftsParams  : any;

  //References the #calendar (FullCalendar):
  @ViewChild('calendar') calendarComponent!: FullCalendarComponent;

  //Set FullCalendar Default options:
  public calendarOptions: CalendarOptions = this.sharedProp.mainSettings.FullCalendarOptions;

  //Initializate Calendar Resources:
  public calendarResources: any = [];

  //Define Formgroup (Reactive form handling):
  public form!: FormGroup;

  //Set Reactive form:
  private setReactiveForm(fields: any): void{
    this.form = this.formBuilder.group(fields);
  }

  //Inject services to the constructor:
  constructor(
    public formBuilder: FormBuilder,
    public sharedProp: SharedPropertiesService,
    public sharedFunctions: SharedFunctionsService
  ){
    //Pass Service Method:
    this.getKeys = this.sharedFunctions.getKeys;

    //Get Logged User Information:
    this.sharedProp.userLogged = this.sharedFunctions.getUserInfo();

    //Set action properties:
    sharedProp.actionSetter({
      content_title   : 'Calendario de turnos y citas',
      content_icon    : 'calendar_month',
      add_button      : false,
      filters_form    : false
    });

    //Set pager default values to prevent undefined pager error:
    this.sharedProp.pager = { page_number: 1, page_limit: this.sharedProp.mainSettings.appSettings.default_page_sizes[0] };

    //Set Reactive Form (First time):
    this.setReactiveForm({
      domain : ['']
    });
  }

  ngOnInit(): void {
    //Clear current imaging:
    this.sharedProp.current_imaging = {};

    //Find references:
    this.findReferences();

    //Set current date:
    const today = new Date();

    //Get current date separately:
    const currentYear   = today.getFullYear();
    const currentMonth  = today.getMonth();
    const currentDay    = today.getDate();

    //Set date range limit manually:
    // Min date: 1 month back from today.
    // Max date: 11 months forward from today.
    const dateRangeLimit = {
      minDate: new Date(currentYear, currentMonth - 1, 1),
      maxDate: new Date(currentYear, currentMonth + 11, currentDay)
    };

    //Set min and max dates (Datepicker):
    this.minDate = dateRangeLimit.minDate;
    this.maxDate = dateRangeLimit.maxDate;

    //Set FullCalendar Languaje:
    this.calendarOptions['locale'] = esLocale;

    //Set FullCalendar min and max date:
    this.calendarOptions['validRange'] = {
      start: this.minDate,
      end: this.maxDate
    };

    //Set FullCalendar Custom Buttons methods:
    this.calendarOptions['customButtons'] = {
      datepicker: {
        text: 'BUSCAR FECHA',
        click: () => {
          this.openDatePicker();
        }
      },
      normal_slots: {
        text: 'TURNOS COMÚNES',
        click: () => {
          //Find slots:
          this.findSlots();
        }
      },
      urgency_slots: {
        text: 'TURNOS URGENTES',
        click: () => {
          //Find slots (urgency true):
          this.findSlots(true);
        }
      },
      view_day: {
        text: 'DÍA',
        click: () => {
          this.calendarComponent.getApi().changeView('resourceTimeGridDay');
        }
      },
      view_week: {
        text: 'SEMANA',
        click: () => {
          this.calendarComponent.getApi().changeView('resourceTimeGridWeek');
        }
      },
    };

    //Enable normal and urgency slots custom buttons:
    let headerToolbar: any = this.calendarOptions.headerToolbar?.valueOf();
    headerToolbar['end'] = 'normal_slots urgency_slots';

    //Set eventClick:
    this.calendarOptions.eventClick = (arg) => {
      //Check that it is not a background event (slot) or a tentative event:
      if(arg.event._def.ui.display !== 'background' && Object.keys(arg.event.extendedProps).length > 0){
        //Create operation handler:
        const operationHandler = {
          event_data : arg.event.extendedProps
        };

        //Open dialog:
        this.sharedFunctions.openDialog('event_details', operationHandler);
      }
    }

    // Fix FullCalendar bug first Render:
    this.sharedFunctions.fixFullCalendarRender();

    //Find slots:
    this.findSlots(false, true);
  }

  openDatePicker(){
    //Get datepicker input from DOM:
    const $datepicker = document.getElementById('invisible-datepicker');

    //Trigger click event:
    $datepicker?.click();
  }

  onChangeDate(event: any){
    //Go to date in Fullcalendar:
    this.calendarComponent.getApi().gotoDate(new Date(event.value))
  }

  findSlots(urgency: boolean = false, first_search: boolean = false, change_service: boolean = false){
    //Check current imaging and current procedure:
    if(this.sharedProp.current_imaging !== undefined && Object.keys(this.sharedProp.current_imaging).length > 0){
      //Clear FullCalendar:
      if(first_search == false || change_service == true){
        this.calendarComponent.getApi().removeAllEvents();
        this.calendarOptions['resources'] = [];
      }

      //Clear calendar resource only if change service:
      if(change_service == true){
        this.calendarResources = [];
      }

      //Initialize Slot Background color:
      let slotBackgroundColor = '#05ff9f49';

      //Check urgency:
      if(urgency){
        slotBackgroundColor = '#f44336a1'
      }

      //Set max date filter format:
      let minDateString = this.minDate.getFullYear() + '-' + this.minDate.toLocaleString("es-AR", { month: "2-digit" }) + '-' + this.minDate.toLocaleString("es-AR", { day: "2-digit" }) + 'T00:00:00.000Z';
      const maxDateString = this.maxDate.getFullYear() + '-12-31T00:00:00.000Z'

      //Set slots params (Background events):
      this.slotsParams = {
        //Filter:
        'filter[and][domain.organization]': this.sharedProp.current_imaging.organization._id,
        'filter[and][domain.branch]': this.sharedProp.current_imaging.branch._id,
        'filter[and][domain.service]': this.sharedProp.current_imaging.service._id,
        'filter[and][start][$gte]': minDateString,
        'filter[and][end][$lte]': maxDateString,
        'filter[and][urgency]': urgency,

        //Projection:
        'proj[start]': 1,
        'proj[end]': 1,
        'proj[urgency]': 1,
        'proj[equipment._id]': 1,
        'proj[equipment.name]': 1
      };

      //Set appointments params (Events):
      this.appointmentsParams = {
        //Filter:
        'filter[and][imaging.organization._id]': this.sharedProp.current_imaging.organization._id,
        'filter[and][imaging.branch._id]': this.sharedProp.current_imaging.branch._id,
        'filter[and][imaging.service._id]': this.sharedProp.current_imaging.service._id,
        'filter[and][flow_state]': 'A01', //Coordinated appointments
        'filter[and][status]': true,
        'filter[and][start][$gte]': minDateString,
        'filter[and][end][$lte]': maxDateString,

        //Projection:
        'proj[start]': 1,
        'proj[end]': 1,
        'proj[urgency]': 1,
        'proj[outpatient]': 1,
        'proj[inpatient]': 1,
        'proj[procedure.name]': 1,
        'proj[slot.equipment._id]':1,
        'proj[patient.person.documents]': 1,
        'proj[patient.person.name_01]': 1,
        'proj[patient.person.name_02]': 1,
        'proj[patient.person.surname_01]': 1,
        'proj[patient.person.surname_02]': 1,
        'proj[overbooking]': 1
      };

      //Set appointments drafts params (In progress events)
      this.appointmentsDraftsParams = {
        //Filter:
        'filter[and][imaging.organization._id]': this.sharedProp.current_imaging.organization._id,
        'filter[and][imaging.branch._id]': this.sharedProp.current_imaging.branch._id,
        'filter[and][imaging.service._id]': this.sharedProp.current_imaging.service._id,
        'filter[and][start][$gte]': minDateString,
        'filter[and][end][$lte]': maxDateString,

        //Projection:
        'proj[start]': 1,
        'proj[end]': 1,
        'proj[urgency]': 1,
        'proj[procedure.name]': 1,
        'proj[slot.equipment._id]':1,
        'proj[patient.person.documents]': 1,
        'proj[patient.person.name_01]': 1,
        'proj[patient.person.name_02]': 1,
        'proj[patient.person.surname_01]': 1,
        'proj[patient.person.surname_02]': 1,
        'proj[coordinator.person.name_01]': 1,
        'proj[coordinator.person.name_02]': 1,
        'proj[coordinator.person.surname_01]': 1,
        'proj[coordinator.person.surname_02]': 1,
        'proj[overbooking]': 1
      };

      //Create slots observable slots:
      const obsSlots = this.sharedFunctions.findRxJS('slots', this.slotsParams).pipe(
        //Get equipments (resources) and slots (background events):
        map(async (res: any) => {

          //Check data:
          if(res.data){
            if(res.data.length > 0){
              //Create registered equipments array (Duplicated control):
              let registeredEquipments: string[] = [];
              
              //Create slotsIN array:
              let slotsIN: any[] = [];

              //Set currentEquipments - FullCalendar Resources (await foreach):
              await Promise.all(Object.keys(res.data).map(async (key) => {

                //Check duplicates:
                if(!registeredEquipments.includes(res.data[key].equipment._id)){
                  //Set current resource:
                  let currentResource = {
                    id: res.data[key].equipment._id,
                    title: res.data[key].equipment.name
                  };

                  //Add resouces in calendar (Equipments):
                  this.calendarComponent.getApi().addResource(currentResource);

                  //Check if current equipments exist in calendarResources:
                  const resourceDuplicated = this.calendarResources.find(({ id } : any) => id === res.data[key].equipment._id);

                  //Add resouces in calendar resources object (To preserve in view changes cases):
                  if((first_search == true || change_service == true) && resourceDuplicated == undefined){
                    this.calendarResources.push(currentResource);
                  }
                }

                //Register equipment:
                registeredEquipments.push(res.data[key].equipment._id);

                //Add current _id slot into slotIN Array:
                slotsIN.push(res.data[key]._id);

                //Add background events in calendar (Slots):
                this.calendarComponent.getApi().addEvent({
                  classNames: res.data[key]._id,            //Add slot _id in classes (Future set fk_slot)
                  resourceId: res.data[key].equipment._id,
                  start: res.data[key].start.slice(0, -5),  //Remove last 5 chars '.000Z'
                  end: res.data[key].end.slice(0, -5),      //Remove last 5 chars '.000Z'
                  display: 'background',
                  backgroundColor: slotBackgroundColor
                });

              }));

              //Register slots _id (IN Appointment and Appointments drafts condition):
              this.appointmentsParams['filter[in][slot._id]'] = slotsIN;
              this.appointmentsDraftsParams['filter[in][slot._id]'] = slotsIN;
            }
          }

          //Return response:
          return res;
        }),

        //Filter that only NO success cases continue:
        filter((res: any) => res.success !== true),

        //Search appointments - FullCalendar events (Return observable):
        mergeMap(() => this.sharedFunctions.findRxJS('appointments', this.appointmentsParams)),

        //Check and set Events:
        map(async (res: any) => {
          //Check data:
          if(res.data){
            if(res.data.length > 0){
              //Set currentAppointments - FullCalendar Events (await foreach):
              await Promise.all(Object.keys(res.data).map((key) => {

                //Set event colors by default configuration (Enviroment):
                let backgroundColor = this.sharedProp.mainSettings.FullCalendarOptions.eventColor;
                let borderColor = this.sharedProp.mainSettings.FullCalendarOptions.eventBorderColor;
                let textColor = this.sharedProp.mainSettings.FullCalendarOptions.eventTextColor;

                //Set event colors by default configuration (Urgency or not):
                if(res.data[key].urgency){
                  backgroundColor = '#f44336';
                  borderColor = '#f7594d';
                  textColor = '#fff';
                }

                //Check overbooking:
                if(res.data[key].overbooking){
                  textColor = '#ffdcdc';
                }

                //Add event in calendar (Appointment):
                this.calendarComponent.getApi().addEvent({
                  id: res.data[key]._id,
                  resourceId: res.data[key].slot.equipment._id,
                  title: res.data[key].procedure.name,
                  start: res.data[key].start.slice(0, -5),  //Remove last 5 chars '.000Z'
                  end: res.data[key].end.slice(0, -5),       //Remove last 5 chars '.000Z'
                  backgroundColor: backgroundColor,
                  borderColor: borderColor,
                  textColor: textColor,
                  extendedProps: {
                    patient: {
                      'documents'   : res.data[key].patient.person.documents,
                      'name_01'     : res.data[key].patient.person.name_01,
                      'name_02'     : res.data[key].patient.person.name_02,
                      'surname_01'  : res.data[key].patient.person.surname_01,
                      'surname_02'  : res.data[key].patient.person.surname_02
                    },
                    overbooking: res.data[key].overbooking
                  }
                });
              }));
            }
          }

          //Return response:
          return res;
        }),

        //Search appointments drafts - FullCalendar In progress events (Return observable):
        /*
        mergeMap(() => this.sharedFunctions.findRxJS('appointments_drafts', this.appointmentsDraftsParams)),

        //Check and set In progress Events:
        map(async (res: any) => {
          //Check data:
          if(res.data){
            if(res.data.length > 0){
              //Set currentAppointments drafts - FullCalendar Events (await foreach):
              await Promise.all(Object.keys(res.data).map((key) => {

                //Set event colors by default configuration (Enviroment):
                let backgroundColor = '#424242';
                let borderColor = '#4f4f4f';
                let textColor = '#fff';

                //Set event colors by default configuration (Urgency or not):
                if(res.data[key].urgency){
                  backgroundColor = '#f44336';
                  borderColor = '#f7594d';
                  textColor = '#fff'
                }

                //Add event in calendar (Appointment drafts):
                this.calendarComponent.getApi().addEvent({
                  id: res.data[key]._id,
                  resourceId: res.data[key].slot.equipment._id,
                  title: res.data[key].procedure.name + ' [Coordinación en curso]',
                  start: res.data[key].start.slice(0, -5),  //Remove last 5 chars '.000Z'
                  end: res.data[key].end.slice(0, -5),       //Remove last 5 chars '.000Z'
                  backgroundColor: backgroundColor,
                  borderColor: borderColor,
                  textColor: textColor,
                  extendedProps: {
                    patient: {
                      'documents'   : res.data[key].patient.person.documents,
                      'name_01'     : res.data[key].patient.person.name_01,
                      'name_02'     : res.data[key].patient.person.name_02,
                      'surname_01'  : res.data[key].patient.person.surname_01,
                      'surname_02'  : res.data[key].patient.person.surname_02
                    },
                    coordinator: {
                      'name_01'     : res.data[key].coordinator.person.name_01,
                      'name_02'     : res.data[key].coordinator.person.name_02,
                      'surname_01'  : res.data[key].coordinator.person.surname_01,
                      'surname_02'  : res.data[key].coordinator.person.surname_02
                    }
                  }
                });
              }));
            }
          }

          //Return response:
          return res;
        }),
        */
      );

      //Observe content (Subscribe):
      obsSlots.subscribe();
    }
  }

  async setResources(resource_id: string){
    //Set one or all resources (Equipments):
    if(resource_id == 'ALL'){
      this.calendarOptions.resources = this.calendarResources;
    } else {
      //Remove all resources:
      this.calendarOptions.resources = [];

      //Search in preserved calendar resources (Await foreach):
      await Promise.all(Object.keys(this.calendarResources).map((key) => {

        //Add indicated resource in calendar by _id (Equipment):
        if(this.calendarResources[key].id == resource_id){
          this.calendarOptions.resources = [this.calendarResources[key]];
        }
      }));
    }
  }

  onSetDomain(organization_id: string, branch_id: string, service_id: string){
    //Set current imaging with selected domain:
    this.sharedProp.current_imaging = {
      'organization'  : { '_id' : organization_id },
      'branch'        : { '_id' : branch_id },
      'service'       : { '_id' : service_id }
    };

    //Find slots:
    this.findSlots(false, false, true);
  }

  findReferences(){
    //Set params:
    let params: any = { 'filter[status]': true };

    //Find organizations:
    this.sharedFunctions.find('organizations', params, (res) => {
      this.availableOrganizations = res.data;
    });

    //Find branches:
    this.sharedFunctions.find('branches', params, (res) => {
      this.availableBranches = res.data;
    });

    //Find services:
    this.sharedFunctions.find('services', params, (res) => {
      this.availableServices = res.data;
    });
  }
}
