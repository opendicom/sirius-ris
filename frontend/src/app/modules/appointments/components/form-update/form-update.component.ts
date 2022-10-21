import { Component, OnInit, ViewChild } from '@angular/core';

//--------------------------------------------------------------------------------------------------------------------//
// IMPORTS:
//--------------------------------------------------------------------------------------------------------------------//
import { Router, ActivatedRoute } from '@angular/router';                                   // Router and Activated Route Interface (To get information about the routes)
import { FormGroup, FormBuilder } from '@angular/forms';                                    // Reactive form handling tools
import { SharedPropertiesService } from '@shared/services/shared-properties.service';       // Shared Properties
import { SharedFunctionsService } from '@shared/services/shared-functions.service';         // Shared Functions
import { app_setting, ISO_3166, document_types, gender_types } from '@env/environment';     // Enviroments

// Child components:
import { TabDetailsComponent } from '@modules/appointments/components/form-update/tab-details/tab-details.component';
import { TabSlotComponent } from '@modules/appointments/components/form-update/tab-slot/tab-slot.component';
//--------------------------------------------------------------------------------------------------------------------//

@Component({
  selector: 'app-form-update',
  templateUrl: './form-update.component.html',
  styleUrls: ['./form-update.component.css']
})
export class FormUpdateComponent implements OnInit {
  //Import tabs components (Properties and Methods) [Child components]:
  @ViewChild(TabDetailsComponent) tabDetails!:TabDetailsComponent;
  @ViewChild(TabSlotComponent) tabSlot!:TabSlotComponent;

  //Set component properties:
  public settings             : any = app_setting;
  public country_codes        : any = ISO_3166;
  public document_types       : any = document_types;
  public gender_types         : any = gender_types;

  //Re-define method in component to use in HTML view:
  public getKeys: any;

  //Define Formgroup (Reactive form handling):
  public form!: FormGroup;

  //Inject services, components and router to the constructor:
  constructor(
    public formBuilder          : FormBuilder,
    private router              : Router,
    private objRoute            : ActivatedRoute,
    public sharedProp           : SharedPropertiesService,
    public sharedFunctions      : SharedFunctionsService,
    //private tabDetailsComponent : TabDetailsComponent
  ){
    //Pass Service Method:
    this.getKeys = this.sharedFunctions.getKeys;

    //Get Logged User Information:
    this.sharedProp.userLogged = this.sharedFunctions.getUserInfo();

    //Set action properties:
    sharedProp.actionSetter({
      content_title : 'Formulario de actualización de cita',
      content_icon  : 'edit_calendar',
      add_button    : false,
      filters_form  : false,
    });

    //Set element:
    sharedProp.elementSetter('appointments');
  }

  ngOnInit(): void {
    //Extract sent data (Parameters by routing):
    this.sharedProp.current_id = this.objRoute.snapshot.params['_id'];

    //Check if element is not empty:
    if(this.sharedProp.current_id != ''){
      //Request params:
      const params = {
        'filter[_id]': this.sharedProp.current_id,
        'proj[attached_files.base64]': 0,
        'proj[consents.informed_consent.base64]': 0,
        'proj[consents.clinical_trial.base64]': 0
      };

      //Find element to update:
      this.sharedFunctions.find(this.sharedProp.element, params, (res) => {

        //Check operation status:
        if(res.success === true){
          //Set sharedProp current data:
          //Current Study IUID:
          this.sharedProp.current_study_iuid = res.data[0].study_iuid;

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

          //Excecute manual onInit childrens components:
          this.tabDetails.manualOnInit();
          this.tabSlot.manualOnInit();
        } else {
          //Return to the list with request error message:
          this.sharedFunctions.sendMessage('Error al intentar editar el elemento: ' + res.message);
          this.router.navigate(['/' + this.sharedProp.element + '/list']);
        }
      });
    }
  }

  onCancel(){
    //Redirect to the list:
    this.sharedFunctions.gotoList(this.sharedProp.element, this.router);
  }

  onSubmitMaster(){
    //Send multiple submits:
    this.tabDetails.onSubmit();
  }
}
