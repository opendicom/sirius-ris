import { Component, OnInit } from '@angular/core';

//--------------------------------------------------------------------------------------------------------------------//
// IMPORTS:
//--------------------------------------------------------------------------------------------------------------------//
import { SharedPropertiesService } from '@shared/services/shared-properties.service';       // Shared Properties
import { SharedFunctionsService } from '@shared/services/shared-functions.service';         // Shared Functions
//--------------------------------------------------------------------------------------------------------------------//

@Component({
  selector: 'app-form',
  templateUrl: './form.component.html',
  styleUrls: ['./form.component.css']
})
export class FormComponent implements OnInit {

  //Inject services, components and router to the constructor:
  constructor(
    public sharedProp: SharedPropertiesService,
    private sharedFunctions: SharedFunctionsService
  ) {
    //--------------------------------------------------------------------------------------------------------------------//
    // TEST:
    //--------------------------------------------------------------------------------------------------------------------//
    this.sharedProp.current_patient = { "_id": "62bef5cc67d1c30013f612f4", "status": true, "fk_person": "62bc68f266d77500136f5a32", "email": "milhouse.vanhouten@gmail.com", "permissions": [ { "concession": [], "organization": "6220b26e0feaeeabbd5b0d93", "role": 2 } ], "settings": [], "createdAt": "2022-07-01T13:25:32.539Z", "updatedAt": "2022-08-10T17:41:20.655Z", "__v": 0, "person": { "_id": "62bc68f266d77500136f5a32", "phone_numbers": [ "099654283", "24819374" ], "documents": [ { "doc_country_code": "858", "doc_type": 1, "document": "12345672" } ], "name_01": "MILHOUSE", "surname_01": "VAN HOUTEN", "birth_date": "2011-08-10T00:00:00.000Z", "gender": 1, "createdAt": "2022-06-29T15:00:02.159Z", "updatedAt": "2022-08-10T17:41:20.612Z", "__v": 0 } } ;
    this.sharedProp.current_imaging = { "organization": { "_id": "6220b2610feaeeabbd5b0d84", "short_name": "CUDIM" }, "branch": { "_id": "6267e4200723c74097757338", "short_name": "Clínica Ricaldoni" }, "service": { "_id": "6267e576bb4e2e4f54931fab", "name": "PET-CT" } };
    this.sharedProp.current_modality = '6267e558bb4e2e4f54931fa7';
    this.sharedProp.current_procedure = { "_id": "62eabb5b959cca00137d2bf9", "name": "WHB FDG", "equipments": [ { "fk_equipment": "62692da265d8d3c8fb4cdcaa", "duration": 40, "details": { "_id": "62692da265d8d3c8fb4cdcaa", "fk_modalities": [ "6241db9b6806ed898a00128b", "6267e558bb4e2e4f54931fa7" ], "fk_branch": "6267e4200723c74097757338", "name": "GE 690", "serial_number": "SNGE6902010", "AET": "690", "status": true, "updatedAt": "2022-06-16T19:21:33.535Z" } }, { "fk_equipment": "6269303dcc1a061a4b3252dd", "duration": 20, "details": { "_id": "6269303dcc1a061a4b3252dd", "fk_modalities": [ "6241db9b6806ed898a00128b", "6267e558bb4e2e4f54931fa7" ], "fk_branch": "6267e4200723c74097757338", "name": "GE STE", "serial_number": "SNGESTE2010", "AET": "STE", "status": true } } ], "informed_consent": true } ;
    this.sharedProp.current_slot = '6315f41906f346001301990a';
    this.sharedProp.current_equipment = { "fk_equipment": "62692da265d8d3c8fb4cdcaa", "duration": 40, "details": { "_id": "62692da265d8d3c8fb4cdcaa", "fk_modalities": [ "6241db9b6806ed898a00128b", "6267e558bb4e2e4f54931fa7" ], "fk_branch": "6267e4200723c74097757338", "name": "GE 690", "serial_number": "SNGE6902010", "AET": "690", "status": true, "updatedAt": "2022-06-16T19:21:33.535Z" } };
    this.sharedProp.current_datetime = { "dateYear": 2022, "dateMonth": "09", "dateDay": "07", "startHours": "09", "startMinutes": 30, "endHours": 10, "endMinutes": 10, "start": "2022-09-07T09:30:00", "end": "2022-09-07T10:10:00" };
    this.sharedProp.current_urgency = false;
    //--------------------------------------------------------------------------------------------------------------------//

    //Get Logged User Information:
    this.sharedProp.userLogged = this.sharedFunctions.getUserInfo();

    //Set action properties:
    sharedProp.actionSetter({
      content_title : 'Detalles de la cita',
      content_icon  : 'privacy_tip',
      add_button    : false,
      filters_form  : false,
    });
  }

  ngOnInit(): void {
  }

}
