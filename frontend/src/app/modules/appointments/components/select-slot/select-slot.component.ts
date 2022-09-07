import { Component, OnInit, ViewChild } from '@angular/core';

//--------------------------------------------------------------------------------------------------------------------//
// IMPORTS:
//--------------------------------------------------------------------------------------------------------------------//
import { Router } from '@angular/router';                                                   // Router
import { FormGroup, FormControl, FormBuilder, Validators } from '@angular/forms';           // Reactive form handling tools
import { SharedPropertiesService } from '@shared/services/shared-properties.service';       // Shared Properties
import { SharedFunctionsService } from '@shared/services/shared-functions.service';         // Shared Functions
import { FullCalendarComponent, CalendarOptions } from '@fullcalendar/angular';             // FullCalendar Options
import esLocale from '@fullcalendar/core/locales/es';                                       // FullCalendar ES Locale
import { map, mergeMap, filter } from 'rxjs/operators';                                     // Reactive Extensions (RxJS)
import {                                                                                    // Enviroments
  regexObjectId,
  ISO_3166,
  document_types,
  gender_types,
  FullCalendarOptions
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
  public minDate: Date;
  public maxDate: Date;

  //Set references objects:
  public currentModality      : any;

  //Set params objects:
  private slotsParams         : any;
  private appointmentsParams  : any;

  //Set selected elements:
  public selectedEquipment    : any  | undefined;
  public selectedStart        : Date | undefined;
  public selectedEnd          : Date | undefined;

  //References the #calendar (FullCalendar):
  @ViewChild('calendar') calendarComponent!: FullCalendarComponent;

  //Set FullCalendar Default options:
  public calendarOptions: CalendarOptions = FullCalendarOptions;

  //Define Formgroup (Reactive form handling):
  public form!: FormGroup;

  //Set Reactive form:
  private setReactiveForm(fields: any): void{
    this.form = this.formBuilder.group(fields);
  }

  //Inject services, components and router to the constructor:
  constructor(
    private router: Router,
    public formBuilder: FormBuilder,
    public sharedProp: SharedPropertiesService,
    private sharedFunctions: SharedFunctionsService
  ) {
    //Get current date:
    const today = new Date();
    const currentYear   = today.getFullYear();
    const currentMonth  = today.getMonth();
    const currentDay    = today.getDate();

    //Set min and max dates (Datepicker):
    this.minDate = new Date(currentYear - 0, currentMonth, currentDay);
    this.maxDate = new Date(currentYear + 1, 11, 31);

    //--------------------------------------------------------------------------------------------------------------------//
    //TEST:
    //--------------------------------------------------------------------------------------------------------------------//
    //MNFFP:
    //this.sharedProp.current_patient = { "_id": "62bef5cc67d1c30013f612f4", "status": true, "fk_person": "62bc68f266d77500136f5a32", "email": "milhouse.vanhouten@gmail.com", "permissions": [ { "concession": [], "organization": "6220b26e0feaeeabbd5b0d93", "role": 2 } ], "settings": [], "createdAt": "2022-07-01T13:25:32.539Z", "updatedAt": "2022-08-10T17:41:20.655Z", "__v": 0, "person": { "_id": "62bc68f266d77500136f5a32", "phone_numbers": [ "099654283", "24819374" ], "documents": [ { "doc_country_code": "858", "doc_type": 1, "document": "12345672" } ], "name_01": "MILHOUSE", "surname_01": "VAN HOUTEN", "birth_date": "2011-08-10T00:00:00.000Z", "gender": 1, "createdAt": "2022-06-29T15:00:02.159Z", "updatedAt": "2022-08-10T17:41:20.612Z", "__v": 0 } };
    //this.sharedProp.current_imaging = { "organization": { "_id": "6284f7c533afdd00139994ee", "short_name": "MNFFP" }, "branch": { "_id": "628538fffef404001374c353", "short_name": "Sanatorio PET" }, "service": { "_id": "628544d4fef404001374c3b9", "name": "Tomografía PET" } };
    //this.sharedProp.current_modality = '6267e558bb4e2e4f54931fa7';
    //this.sharedProp.current_procedure = { "_id": "631206b1afea9400136c2834", "name": "CBR MET", "equipments": [ { "fk_equipment": "62a9ccccf95f8d0013447131", "duration": 20, "details": { "_id": "62a9ccccf95f8d0013447131", "fk_modalities": [ "6241db9b6806ed898a00128b", "6267e558bb4e2e4f54931fa7" ], "status": true, "fk_branch": "628538fffef404001374c353", "name": "Biograph Horizon", "serial_number": "SMBH2021", "AET": "SMBH", "createdAt": "2022-06-15T12:13:00.810Z", "updatedAt": "2022-06-15T12:13:00.810Z", "__v": 0 } } ], "informed_consent": false };

    //CUDIM:
    this.sharedProp.current_patient = { "_id": "62bef5cc67d1c30013f612f4", "status": true, "fk_person": "62bc68f266d77500136f5a32", "email": "milhouse.vanhouten@gmail.com", "permissions": [ { "concession": [], "organization": "6220b26e0feaeeabbd5b0d93", "role": 2 } ], "settings": [], "createdAt": "2022-07-01T13:25:32.539Z", "updatedAt": "2022-08-10T17:41:20.655Z", "__v": 0, "person": { "_id": "62bc68f266d77500136f5a32", "phone_numbers": [ "099654283", "24819374" ], "documents": [ { "doc_country_code": "858", "doc_type": 1, "document": "12345672" } ], "name_01": "MILHOUSE", "surname_01": "VAN HOUTEN", "birth_date": "2011-08-10T00:00:00.000Z", "gender": 1, "createdAt": "2022-06-29T15:00:02.159Z", "updatedAt": "2022-08-10T17:41:20.612Z", "__v": 0 } } ;
    this.sharedProp.current_imaging = { "organization": { "_id": "6220b2610feaeeabbd5b0d84", "short_name": "CUDIM" }, "branch": { "_id": "6267e4200723c74097757338", "short_name": "Clínica Ricaldoni" }, "service": { "_id": "6267e576bb4e2e4f54931fab", "name": "PET-CT" } };
    this.sharedProp.current_modality = '6267e558bb4e2e4f54931fa7';
    this.sharedProp.current_procedure = { "_id": "62eabb5b959cca00137d2bf9", "name": "WHB FDG", "equipments": [ { "fk_equipment": "62692da265d8d3c8fb4cdcaa", "duration": 40, "details": { "_id": "62692da265d8d3c8fb4cdcaa", "fk_modalities": [ "6241db9b6806ed898a00128b", "6267e558bb4e2e4f54931fa7" ], "fk_branch": "6267e4200723c74097757338", "name": "GE 690", "serial_number": "SNGE6902010", "AET": "690", "status": true, "updatedAt": "2022-06-16T19:21:33.535Z" } }, { "fk_equipment": "6269303dcc1a061a4b3252dd", "duration": 20, "details": { "_id": "6269303dcc1a061a4b3252dd", "fk_modalities": [ "6241db9b6806ed898a00128b", "6267e558bb4e2e4f54931fa7" ], "fk_branch": "6267e4200723c74097757338", "name": "GE STE", "serial_number": "SNGESTE2010", "AET": "STE", "status": true } } ], "informed_consent": true } ;
    //--------------------------------------------------------------------------------------------------------------------//

    //Find references:
    this.findReferences();

    //Get Logged User Information:
    this.sharedProp.userLogged = this.sharedFunctions.getUserInfo();

    //Set action properties:
    sharedProp.actionSetter({
      content_title : 'Coordinar procedimiento sobre un turno',
      content_icon  : 'event_available',
      add_button    : false,
      filters_form  : false,
    });

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
      }
    };

    //Bind dateClick event:
    this.calendarOptions.dateClick = this.onClickSlot.bind(this);
  }

  ngOnInit(): void {
    // Fix FullCalendar bug first Render:
    // https://github.com/fullcalendar/fullcalendar/issues/4976
    setTimeout(() => {
      window.dispatchEvent(new Event('resize'));
    }, 1);

    //Find slots:
    this.findSlots(false, true);
  }

  onSubmit(){

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
    //Clear FullCalendar:
    if(first_search == false){
      this.calendarComponent.getApi().removeAllEvents();
      this.calendarOptions['resources'] = [];
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
      'proj[slot.equipment._id]':1
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
            await Promise.all(Object.keys(res.data).map((key) => {
              //Check duplicates:
              if(!registeredEquipments.includes(res.data[key].equipment._id)){

                //Add resouces in calendar (Equipments):
                this.calendarComponent.getApi().addResource({
                  id: res.data[key].equipment._id,
                  title: res.data[key].equipment.name
                });
              }

              //Register equipment:
              registeredEquipments.push(res.data[key].equipment._id);

              //Register slots _id (IN Appointment condition):
              this.appointmentsParams['filter[in][slot._id][' + key + ']'] = res.data[key]._id;

              //Add background events in calendar (Slots):
              this.calendarComponent.getApi().addEvent({
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

      //Filter that only success cases continue:
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
              //Add event in calendar (Appointment):
              this.calendarComponent.getApi().addEvent({
                id: res.data[key]._id,
                resourceId: res.data[key].slot.equipment._id,
                title: res.data[key].procedure.name,
                start: res.data[key].start.slice(0, -5),  //Remove last 5 chars '.000Z'
                end: res.data[key].end.slice(0, -5)       //Remove last 5 chars '.000Z'
              });
            }));
          }
        }

        //Return response:
        return res;
      })
    );

    //Observe content (Subscribe):
    obsSlots.subscribe();
  }

  onCheckUrgency(event: any){
    //Clear selected datetimes and selected equipments:
    this.selectedEquipment = undefined;
    this.selectedStart = undefined;
    this.selectedEnd = undefined;

    //Check if urgency is true or false (string):
    if(event.value == 'true'){
      //Get value (The interface calendarOptions for data type headertoolbar does not find property 'end'):
      let headerToolbar: any = this.calendarOptions.headerToolbar?.valueOf();

      //Add slots types custom buttons:
      headerToolbar['end'] = 'normal_slots urgency_slots';

      //Overwrite header toolbar in FullCalendar Options:
      this.calendarOptions.headerToolbar = headerToolbar;

      //Find slots (urgency true):
      this.findSlots(true);

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

  async onClickSlot(arg: any){
    if(arg.jsEvent.target.classList.contains('fc-bg-event')) {
      //Set selected start:
      let stringDate = arg.dateStr.slice(0, -1);
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
      const formattedDateTime = this.datetimeFulCalendarFormater(this.selectedStart, this.selectedEnd);

      //Check if the event is overlapped:
      const isOverlapping = await this.isOverlapping(formattedDateTime, this.selectedEquipment.fk_equipment);

      //If is overlapped:
      if(isOverlapping) {
        //Get time required:
        let timeRequired = this.selectedEquipment.duration;

        //Clear selected elements:
        this.selectedEquipment  = undefined;
        this.selectedStart      = undefined;
        this.selectedEnd        = undefined;

        //Open dialog:
        this.sharedFunctions.openDialog('overlap_events', timeRequired);

      } else {
        //Add tentative event in FullCalendar:
        this.calendarComponent.getApi().addEvent({
          id: 'nowid',
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
      this.sharedFunctions.openDialog('slot_select', 'stuff_data');
    }
  }

  findReferences(){
    //Initialize params:
    const params = {
      'filter[_id]': this.sharedProp.current_modality,
      'filter[status]': true
    };

    //Find organizations:
    this.sharedFunctions.find('modalities', params, (res) => {
      this.currentModality = res.data[0];
    });
  }

  addZero(i: any) {
    if(i < 10){
      i = "0" + i.toString()
    }
    return i;
  }

  datetimeFulCalendarFormater(start: any, end: any): any{
    //Date:
    const dateYear   = start.getFullYear();
    const dateMonth  = start.toLocaleString("es-AR", { month: "2-digit" });
    const dateDay    = start.toLocaleString("es-AR", { day: "2-digit" })

    //Start:
    const startHours    = this.addZero(start.getUTCHours());
    const startMinutes  = this.addZero(start.getUTCMinutes());

    //End:
    const endHours    = this.addZero(end.getUTCHours());
    const endMinutes  = this.addZero(end.getUTCMinutes());

    //Set start and end FullCalendar format:
    const startStr = dateYear + '-' + dateMonth + '-' + dateDay + 'T' + startHours + ':' + startMinutes + ':00';
    const endStr   = dateYear + '-' + dateMonth + '-' + dateDay + 'T' + endHours + ':' + endMinutes + ':00';

    //Set return object:
    return {
      dateYear      : dateYear,
      dateMonth     : dateMonth,
      dateDay       : dateDay,
      startHours    : startHours,
      startMinutes  : startMinutes,
      endHours      : endHours,
      endMinutes    : endMinutes,
      start         : startStr,
      end           : endStr
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
        const currentDateTime = this.datetimeFulCalendarFormater(currentStart, currentEnd);

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
}
