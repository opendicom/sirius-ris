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

  //Set references objects:
  public currentModality : any;

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
    //TEST:
    this.sharedProp.current_patient = { "_id": "62bef5cc67d1c30013f612f4", "status": true, "fk_person": "62bc68f266d77500136f5a32", "email": "milhouse.vanhouten@gmail.com", "permissions": [ { "concession": [], "organization": "6220b26e0feaeeabbd5b0d93", "role": 2 } ], "settings": [], "createdAt": "2022-07-01T13:25:32.539Z", "updatedAt": "2022-08-10T17:41:20.655Z", "__v": 0, "person": { "_id": "62bc68f266d77500136f5a32", "phone_numbers": [ "099654283", "24819374" ], "documents": [ { "doc_country_code": "858", "doc_type": 1, "document": "12345672" } ], "name_01": "MILHOUSE", "surname_01": "VAN HOUTEN", "birth_date": "2011-08-10T00:00:00.000Z", "gender": 1, "createdAt": "2022-06-29T15:00:02.159Z", "updatedAt": "2022-08-10T17:41:20.612Z", "__v": 0 } };
    this.sharedProp.current_imaging = { "organization": { "_id": "6220b2610feaeeabbd5b0d84", "short_name": "CUDIM" }, "branch": { "_id": "6267e4200723c74097757338", "short_name": "Clínica Ricaldoni" }, "service": { "_id": "6267e576bb4e2e4f54931fab", "name": "PET-CT" } } ;
    this.sharedProp.current_modality = '6267e558bb4e2e4f54931fa7';
    this.sharedProp.current_procedure = { "_id": "62e2953176871af423173c28", "name": "WHB FDG", "equipments": [ { "fk_equipment": "62a9ccccf95f8d0013447131", "duration": 33, "details": { "_id": "62a9ccccf95f8d0013447131", "fk_modalities": [ "6241db9b6806ed898a00128b", "6267e558bb4e2e4f54931fa7" ], "status": true, "fk_branch": "628538fffef404001374c353", "name": "Biograph Horizon", "serial_number": "SMBH2021", "AET": "SMBH", "createdAt": "2022-06-15T12:13:00.810Z", "updatedAt": "2022-06-15T12:13:00.810Z", "__v": 0 } } ], "informed_consent": true };

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

    //Set FullCalendar Languaje:
    this.calendarOptions['locale'] = esLocale;

    //Set FullCalendar Custom Buttons:
    this.calendarOptions['customButtons'] = {
      datepicker: {
        text: 'Buscar fecha',
        click: () => {
          this.openDatePicker();
        }
      }
    };
    this.calendarOptions['headerToolbar'] = {
      start: 'datepicker',
      center: 'title',
      end: 'today prev,next'
    };

    //Set FullCalendar Resources (Equipments):
    this.calendarOptions['resources'] = [
      {
        id: 'a',
        title: 'GE 690'
      },
      {
        id: 'b',
        title: 'GE STE'
      },
      {
        id: 'c',
        title: 'GE IQ'
      }
    ];

    //Set FullCalendar Events:
    this.calendarOptions['events'] = [
      {
        id: '1',
        resourceId: 'a',
        title: 'WHB FDG',
        start: '2022-08-31T10:30:00',
        end: '2022-08-31T11:30:00',
      },
      {
        id: '2',
        resourceId: 'b',
        title: 'CBR MET',
        start: '2022-09-01T09:30:00',
        end: '2022-09-01T10:30:00',
      },
      {
        id: '3',
        resourceId: 'a',
        title: 'WHB GDT',
        start: '2022-09-01T11:30:00',
        end: '2022-09-01T12:30:00',
      },

      //Background events (Slots):
      {
        resourceId: 'a',
        start: '2022-09-01T07:00:00',
        end: '2022-09-01T18:00:00',
        display: 'background'
      }
    ];
  }

  ngOnInit(): void {
    // Fix FullCalendar bug first Render:
    // https://github.com/fullcalendar/fullcalendar/issues/4976
    setTimeout(() => {
      window.dispatchEvent(new Event('resize'));
    }, 1);
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
}
