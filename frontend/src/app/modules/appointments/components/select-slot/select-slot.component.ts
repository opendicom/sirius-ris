import { Component, OnInit, ViewChild } from '@angular/core';

//--------------------------------------------------------------------------------------------------------------------//
// IMPORTS:
//--------------------------------------------------------------------------------------------------------------------//
import { Router, ActivatedRoute } from '@angular/router';                                   // Router and Activated Route Interface (To get information about the routes)
import { FormGroup, FormBuilder } from '@angular/forms';                                    // Reactive form handling tools
import { SharedPropertiesService } from '@shared/services/shared-properties.service';       // Shared Properties
import { SharedFunctionsService } from '@shared/services/shared-functions.service';         // Shared Functions
import { FullCalendarComponent, CalendarOptions } from '@fullcalendar/angular';             // FullCalendar Options
import esLocale from '@fullcalendar/core/locales/es';                                       // FullCalendar ES Locale
import { EventApi } from '@fullcalendar/core';                                              // To manipulate events (overbooking)
import { map, mergeMap, filter } from 'rxjs/operators';                                     // Reactive Extensions (RxJS)
import {                                                                                    // Enviroments
  regexObjectId,
  ISO_3166,
  document_types,
  gender_types
} from '@env/environment';
//--------------------------------------------------------------------------------------------------------------------//

@Component({
  selector: 'app-select-slot',
  templateUrl: './select-slot.component.html',
  styleUrls: ['./select-slot.component.css']
})
export class SelectSlotComponent implements OnInit {
  //Set component properties:
  public country_codes  : any = ISO_3166;
  public document_types : any = document_types;
  public gender_types   : any = gender_types;

  //Min and max dates:
  public minDate: Date = new Date();
  public maxDate: Date = new Date();

  //Set references objects:
  public currentModality      : any;

  //Set params objects:
  private slotsParams               : any;
  private appointmentsParams        : any;
  private appointmentsDraftsParams  : any;

  //Set selected elements:
  public selectedEquipment    : any  | undefined;
  public selectedStart        : Date | undefined;
  public selectedEnd          : Date | undefined;
  public selectedSlot         : any  | undefined;

  //Initializate overbooking input:
  public overbooking         : Boolean = false;

  //Set appointment_request flag:
  public appointment_request    : any;

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

  //Inject services, components and router to the constructor:
  constructor(
    private router          : Router,
    private objRoute        : ActivatedRoute,
    public formBuilder      : FormBuilder,
    public sharedProp       : SharedPropertiesService,
    public sharedFunctions : SharedFunctionsService
  ) {
    //Get Logged User Information:
    this.sharedProp.userLogged = this.sharedFunctions.getUserInfo();

    //Set action properties:
    sharedProp.actionSetter({
      content_title : 'Paso 03 - Coordinar procedimiento sobre un turno',
      content_icon  : 'event_available',
      add_button    : false,
      filters_form  : false,
    });
  }

  ngOnInit(): void {
    //Extract sent data (Parameters by routing):
    this.appointment_request = this.objRoute.snapshot.params['appointment_request'];

    //Set min and max dates (Datepicker):
    const dateRangeLimit = this.sharedFunctions.setDateRangeLimit(new Date()); //Today
    this.minDate = dateRangeLimit.minDate;
    this.maxDate = dateRangeLimit.maxDate;

    //Set Reactive Form (First time):
    this.setReactiveForm({
      urgency           : ['false']
    });

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

    //Bind dateClick event:
    this.calendarOptions.dateClick = this.onClickSlot.bind(this);

    //Find references:
    this.findReferences();

    // Fix FullCalendar bug first Render:
    this.sharedFunctions.fixFullCalendarRender();

    //Find slots:
    this.findSlots(false, true);

    //If in appointment_request the urgency is required click urgency input:
    if(this.sharedProp.current_appointment_request != undefined && this.sharedProp.current_appointment_request.urgency === true){
      this.setReactiveForm({ urgency : ['true'] });
      this.onCheckUrgency({ value : 'true' }, true);
    }
  }

  onCancel(){
    //Redirect to the list:
    this.sharedFunctions.gotoList('appointments', this.router);
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

  findSlots(urgency: boolean = false, first_search: boolean = false){
    //Check current imaging and current procedure:
    if(this.sharedProp.current_imaging !== undefined && this.sharedProp.current_procedure !== undefined){
      //Clear FullCalendar:
      if(first_search == false){
        this.calendarComponent.getApi().removeAllEvents();
        this.calendarOptions['resources'] = [];

        //Clear selected elements:
        this.clearSelectedElements();
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

              //Set currentEquipments - FullCalendar Resources (await foreach):
              await Promise.all(Object.keys(res.data).map(async (key) => {

                //Check duplicates:
                if(!registeredEquipments.includes(res.data[key].equipment._id)){

                  //Get duration from current procedure equipments:
                  await Promise.all(Object.keys(this.sharedProp.current_procedure.equipments).map((keyProcedure) => {
                    if(res.data[key].equipment._id === this.sharedProp.current_procedure.equipments[keyProcedure].fk_equipment){
                      let currentResource = {
                        id: res.data[key].equipment._id,
                        title: res.data[key].equipment.name + ' | ' + this.sharedProp.current_procedure.equipments[keyProcedure].duration + ' min.'
                      };

                      //Add resouces in calendar (Equipments):
                      this.calendarComponent.getApi().addResource(currentResource);

                      //Check if current equipments exist in calendarResources:
                      const resourceDuplicated = this.calendarResources.find(({ id } : any) => id === res.data[key].equipment._id);

                      //Add resouces in calendar resources object (To preserve in view changes cases):
                      if(first_search == true && resourceDuplicated == undefined){
                        this.calendarResources.push(currentResource);
                      }
                    }
                  }));
                }

                //Register equipment:
                registeredEquipments.push(res.data[key].equipment._id);

                //Register slots _id (IN Appointment and Appointments drafts condition):
                this.appointmentsParams['filter[in][slot._id][' + key + ']'] = res.data[key]._id;
                this.appointmentsDraftsParams['filter[in][slot._id][' + key + ']'] = res.data[key]._id;

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
                  textColor = '#fff'
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

                //Check overbooking:
                if(res.data[key].overbooking){
                  textColor = '#ffdcdc';
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
      );

      //Observe content (Subscribe):
      obsSlots.subscribe();
    }
  }

  onCheckUrgency(event: any, first_search: boolean = false){
    //Clear selected elements:
    this.clearSelectedElements();

    //Check if urgency is true or false (string):
    if(event.value == 'true'){
      //Get value (The interface calendarOptions for data type headertoolbar does not find property 'end'):
      let headerToolbar: any = this.calendarOptions.headerToolbar?.valueOf();

      //Add slots types custom buttons:
      headerToolbar['end'] = 'normal_slots urgency_slots';

      //Overwrite header toolbar in FullCalendar Options:
      this.calendarOptions.headerToolbar = headerToolbar;

      //Find slots (urgency true):
      this.findSlots(true, first_search); //First search added to appointment request urgency cases.

    } else {
      //Get value (The interface calendarOptions for data type headertoolbar does not find property 'end'):
      let headerToolbar: any = this.calendarOptions.headerToolbar?.valueOf();

      //Remove slots types custom buttons:
      headerToolbar['end'] = '';

      //Overwrite header toolbar in FullCalendar Options:
      this.calendarOptions.headerToolbar = headerToolbar;

      //Find slots:
      this.findSlots();
    }
  }

  async onDelete(){
    //Get calendar events (current in memory):
    let calendarEvents = this.calendarComponent.getApi().getEvents();

    //Find if tentative event already exist:
    await Promise.all(Object.keys(calendarEvents).map((keyEvents) => {
      if(calendarEvents[parseInt(keyEvents)]._def.publicId == 'tentative'){
        //Get tentative event:
        let tentative_event = this.calendarComponent.getApi().getEventById(calendarEvents[parseInt(keyEvents)]._def.publicId);

        //Remove tentative event:
        tentative_event?.remove();

        //Clear selected elements:
        this.clearSelectedElements();
      }
    }));
  }

  async onClickSlot(arg: any){
    //Check that you click within the slot (Background event):
    if(arg.jsEvent.target.classList.contains('fc-bg-event')) {
      //Get calendar events (current in memory):
      let calendarEvents = this.calendarComponent.getApi().getEvents();

      //Find if tentative event already exist:
      let tentativeExist = false;
      await Promise.all(Object.keys(calendarEvents).map((keyEvents) => {
        if(calendarEvents[parseInt(keyEvents)]._def.publicId == 'tentative'){
          tentativeExist = true;
        }
      }));

      //Check tentative event:
      if(tentativeExist === false){
        //Get slot _id from background event classList:
        let bgEventClassList = arg.jsEvent.target.classList;

        //Filter classes with ObjecId regular expression:
        const slotResult = Object.values(bgEventClassList).filter((currentClass: any) => regexObjectId.test(currentClass))[0];

        //Set selected_slot:
        if(slotResult !== undefined && slotResult !== '' && slotResult !== null){
          this.selectedSlot = slotResult;
        }

        //Set selected start:
        let stringDate = arg.dateStr.slice(0, -6);
        this.selectedStart = new Date(stringDate + '.000Z');

        //Search selected equipment (resource) in current procedure (await foreach):
        await Promise.all(Object.keys(this.sharedProp.current_procedure.equipments).map((key) => {
          if(this.sharedProp.current_procedure.equipments[key].fk_equipment == arg.resource._resource.id){
            //Set selected equipment:
            this.selectedEquipment = this.sharedProp.current_procedure.equipments[key];

            //Set calculated selected end:
            this.selectedEnd = new Date(stringDate + '.000Z');
            this.selectedEnd.setMinutes(this.selectedEnd.getMinutes() + parseInt(this.sharedProp.current_procedure.equipments[key].duration, 10) );
          }
        }));

        //Set date and time in FullCalendar format:
        const formattedDateTime = this.sharedFunctions.datetimeFulCalendarFormater(this.selectedStart, this.selectedEnd);

        //Check if the event is overlapped:
        const isOverlapping = await this.isOverlapping(formattedDateTime, this.selectedEquipment.fk_equipment);

        //If is overlapped:
        if(isOverlapping) {
          //Get time required:
          let timeRequired = this.selectedEquipment.duration;

          //Clear selected elements:
          this.clearSelectedElements();

          //Open dialog:
          this.sharedFunctions.openDialog('overlap_events', timeRequired);

        } else {
          //Add tentative event in FullCalendar:
          this.calendarComponent.getApi().addEvent({
            id: 'tentative',
            resourceId: arg.resource._resource.id,
            title: this.sharedProp.current_procedure.name,
            start: formattedDateTime.start,
            end: formattedDateTime.end,
            backgroundColor: '#b0bec5',
            borderColor: '#909da4',
            textColor: '#17191a'
          });
        }
      } else {
        //Open dialog:
        this.sharedFunctions.openDialog('tentative_exist', 'stuff_data');
      }
    } else {
      //Open dialog:
      this.sharedFunctions.openDialog('slot_select', 'stuff_data');
    }
  }

  onSubmit(){
    //Set current selections in shared properties:
    this.sharedProp.current_equipment = this.selectedEquipment;
    this.sharedProp.current_slot = this.selectedSlot;
    this.sharedProp.current_datetime = this.sharedFunctions.datetimeFulCalendarFormater(this.selectedStart, this.selectedEnd);
    this.sharedProp.current_modality = this.currentModality; //Replace current modality (All information from the modality).

    //Data normalization - Booleans types (mat-option cases):
    if(typeof this.form.value.urgency != "boolean"){ this.sharedProp.current_urgency = this.form.value.urgency.toLowerCase() == 'true' ? true : false; }

    //Create save object (Data normalization):
    let appointmentsDraftsSaveData: any = {
      imaging : {
        organization  : this.sharedProp.current_imaging.organization._id,
        branch        : this.sharedProp.current_imaging.branch._id,
        service       : this.sharedProp.current_imaging.service._id,
      },
      start           : this.sharedProp.current_datetime.start + '.000Z',
      end             : this.sharedProp.current_datetime.end + '.000Z',
      fk_patient      : this.sharedProp.current_patient._id,
      fk_coordinator  : this.sharedProp.userLogged.user_id,
      fk_slot         : this.sharedProp.current_slot,
      fk_procedure    : this.sharedProp.current_procedure._id,
      urgency         : this.sharedProp.current_urgency,
    };

    //Check overbooking:
    if(this.overbooking){
      //Set overbooking into save data (appointment draft):
      appointmentsDraftsSaveData['overbooking'] = 'true';

      //Set overbooking into sharedProp (insert appointment):
      this.sharedProp.current_overbooking = true;
    } else {
      //Set overbooking into sharedProp (insert appointment):
      this.sharedProp.current_overbooking = false;
    }

    //Initializate form destiny (default):
    let form_destiny = '/appointments/form/insert';

    //Check appointment request and add FK in SaveData:
    if(this.appointment_request !== undefined && this.sharedFunctions.stringToBoolean(this.appointment_request) && this.sharedProp.current_appointment_request !== undefined){
      //Check fk_appointment_request is an ObjectId:
      if(regexObjectId.test(this.sharedProp.current_appointment_request._id)){
        appointmentsDraftsSaveData['fk_appointment_request'] = this.sharedProp.current_appointment_request._id;

        //Set form destiny with activated route field (appointment request):
        form_destiny = '/appointments/form/insert/true';
      }
    }

    //Add friendly password if it exists:
    if(this.sharedProp.current_friendly_pass !== ''){
      appointmentsDraftsSaveData['friendly_pass'] = this.sharedProp.current_friendly_pass;
    }

    //Save appointment draft in DB:
    this.sharedFunctions.save('insert', 'appointments_drafts', '', appointmentsDraftsSaveData, [], (res) => {
      //Set current appointment draft only if the operation was successful:
      if(res.success === true){
        this.sharedProp.current_appointment_draft = res.data._id;
      }

      //Response the form according to the result and redirect to appointments form in success case:
      this.sharedFunctions.formResponder(res, form_destiny, this.router, false, '¡Guardado de cita en proceso exitoso!');
    });
  }

  findReferences(){
    //Initialize _id param:
    let _id = undefined;

    //Check current modality:
    if(this.sharedProp.current_modality !== undefined){
      //Check if current modality is a valid ObjectId (Default case):
      if(regexObjectId.test(this.sharedProp.current_modality)){
        _id = this.sharedProp.current_modality;
      //Current modality form component format (Back in browser case):
      } else if(regexObjectId.test(this.sharedProp.current_modality._id)){
        _id = this.sharedProp.current_modality._id;
      }
    }

    if(_id !== undefined && this.sharedProp.current_modality !== undefined){
      //Set params:
      const params = {
        'filter[_id]': _id,
        'filter[status]': true
      };

      //Find modalities:
      this.sharedFunctions.find('modalities', params, (res) => {
        this.currentModality = res.data[0];
      });
    } else {
      //Clear all selected elemets (Force #elseBlockCurrentObj screen):
      this.clearSelectedElements();
    }
  }

  async isOverlapping(inputDateTime: any, inputResource: string){
    //Initialize isOverlap:
    let isOverlap = false;

    //Get calendar events (current in memory):
    let calendarEvents = this.calendarComponent.getApi().getEvents();

    //Search in calendar events (await foreach):
    await Promise.all(Object.keys(calendarEvents).map((key) => {
      //Skip background events (slots):
      if(calendarEvents[parseInt(key, 10)]._def.ui.display != 'background'){
        //Get current event info:
        const currentResource: any = calendarEvents[parseInt(key, 10)]._def.resourceIds;
        const currentStart = calendarEvents[parseInt(key, 10)]._instance?.range.start;
        const currentEnd = calendarEvents[parseInt(key, 10)]._instance?.range.end;

        //Set date and time in FullCalendar format:
        const currentDateTime = this.sharedFunctions.datetimeFulCalendarFormater(currentStart, currentEnd);

        //Check current resource (equipment):
        if(currentResource[0] == inputResource){
          //Check if is overlapping:
          if(!(new Date(currentDateTime.start) >= new Date(inputDateTime.end) || new Date(currentDateTime.end) <= new Date(inputDateTime.start))){
            isOverlap = true;
          }
        }
      }
    }));

    return isOverlap;
  }

  clearSelectedElements(){
    this.selectedEquipment  = undefined;
    this.selectedStart      = undefined;
    this.selectedEnd        = undefined;
    this.selectedSlot       = undefined;
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

  onCheckOverbooking(event: any){
    //Get calendar events (current in memory):
    let calendarEvents = this.calendarComponent.getApi().getEvents();

    //Set overbooking field:
    this.overbooking = event.checked;

    //Verify checkbox:
    if (event.checked) {
      //Remove non-background events:
      calendarEvents.forEach((event: EventApi) => {
        if (event['display'] !== 'background') {
          //Remove overbooked element from calendar:
          event.remove();
        }
      });
    } else {
      //Remove all events:
      this.calendarComponent.getApi().removeAllEvents();

      //Re-initialize slot tab:
      this.ngOnInit();
    }
  }
}
