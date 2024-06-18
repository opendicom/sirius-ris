import { Injectable } from '@angular/core';

//--------------------------------------------------------------------------------------------------------------------//
// IMPORTS:
//--------------------------------------------------------------------------------------------------------------------//
import { Router } from '@angular/router';                                                   // Router
import { SharedPropertiesService } from '@shared/services/shared-properties.service';       // Shared Properties
import { SharedFunctionsService } from '@shared/services/shared-functions.service';         // Shared Functions
import { PdfService } from '@shared/services/pdf.service';                                  // PDF Service
import { FormGroup } from '@angular/forms';                                                 // Reactive form handling tools
import { Country, State, City }  from 'country-state-city';                                 // Country State City
//--------------------------------------------------------------------------------------------------------------------//

@Injectable({
  providedIn: 'root'
})
export class AppointmentsService {
  //Get Country State City information (Default settings):
  public allCountries   : any = Country.getAllCountries();
  public currentStates  : any = State.getStatesOfCountry(this.sharedProp.mainSettings.appSettings.default_country_isoCode);
  public currentCities  : any = City.getCitiesOfState(this.sharedProp.mainSettings.appSettings.default_country_isoCode, this.sharedProp.mainSettings.appSettings.default_state_isoCode);

  //Set references objects:
  public availableOrganizations : any;
  public availableBranches      : any;
  public availableServices      : any;

  //Set referring and reporting objects:
  public referringOrganizations   : any;
  public reportingUsers           : any;

  //Boolean class binding objects:
  public booleanContrast  : Boolean = false;
  public booleanPatology  : Boolean = false;
  public booleanImplants  : Boolean = false;
  public booleanInpatient : Boolean = false;

  //Inject services to the constructor:
  constructor(
    private router          : Router,
    public sharedProp       : SharedPropertiesService,
    private sharedFunctions : SharedFunctionsService,
    public pdfService       : PdfService
  ) { }

  //--------------------------------------------------------------------------------------------------------------------//
  // SET CURRENT STATES:
  //--------------------------------------------------------------------------------------------------------------------//
  setCurrentStates(country_isoCode: string, form: FormGroup){
    //Set current states:
    this.currentStates = State.getStatesOfCountry(country_isoCode);

    //Disable category input:
    form.get('current_address.city')?.disable();
  }
  //--------------------------------------------------------------------------------------------------------------------//


  //--------------------------------------------------------------------------------------------------------------------//
  // SET CURRENT CITIES:
  //--------------------------------------------------------------------------------------------------------------------//
  setCurrentCities(country_isoCode: string, state_isoCode: string, form: FormGroup){
    //Set current cities:
    this.currentCities = City.getCitiesOfState(country_isoCode, state_isoCode);

    //Disable category input:
    form.get('current_address.city')?.enable();
  }
  //--------------------------------------------------------------------------------------------------------------------//


  //--------------------------------------------------------------------------------------------------------------------//
  // ON CHANGE AND ON CHECK LISTENERS:
  //--------------------------------------------------------------------------------------------------------------------//
  onChangeContrast(event: any, form: FormGroup){
    if(event.value == 'true'){
      //Display input:
      this.booleanContrast = true;
    } else {
      //Clear input:
      form.get('contrast.description')?.setValue('');

      //Hide input:
      this.booleanContrast = false;
    }
  }

  onCheckOtherPatology(event: any, form: FormGroup){
    if(event.checked == true){
      //Display input:
      this.booleanPatology = true;
    } else {
      //Clear input:
      form.get('private_health.other')?.setValue('');

      //Hide input:
      this.booleanPatology = false;
    }
  }

  onCheckOtherImplants(event: any, form: FormGroup){
    if(event.checked == true){
      //Display input:
      this.booleanImplants = true;
    } else {
      //Clear input:
      form.get('private_health.implants.other')?.setValue('');

      //Hide input:
      this.booleanImplants = false;
    }
  }

  async onChangeOutpatient(event: any, form: FormGroup){
    if(event.value == 'false'){
      //Display element:
      this.booleanInpatient = true;
    } else {
      //Set clear inputs:
      const clear_inputs = ['inpatient.type', 'inpatient.where', 'inpatient.room', 'inpatient.contact'];

      //Clear inputs:
      await (await Promise.all(Object.keys(clear_inputs))).map((key) => {
        form.get(clear_inputs[parseInt(key)])?.setValue('');
      });

      //Hide element:
      this.booleanInpatient = false;
    }
  }
  //--------------------------------------------------------------------------------------------------------------------//


  //--------------------------------------------------------------------------------------------------------------------//
  // FIND REFERRING ORGANIZATIONS:
  //--------------------------------------------------------------------------------------------------------------------//
  findReferringOrganizations(){
    //Set params:
    const params = {
      'rabc_exclude_code' : this.sharedProp.mainSettings.appSettings.rabc_exclude_code,
      'filter[status]'    : true
    };

    //Find organizations:
    this.sharedFunctions.find('organizations', params, (res) => {
      this.referringOrganizations = res.data;
    });
  }
  //--------------------------------------------------------------------------------------------------------------------//


  //--------------------------------------------------------------------------------------------------------------------//
  // FIND REPORTING USERS (FIND BY SERVICE):
  //--------------------------------------------------------------------------------------------------------------------//
  findReportingUsers(service_id: string, form: FormGroup){
    //Set params:
    const params = {
      //Only people users:
      'filter[person.name_01]': '',
      'regex': true,

      //Only Doctors users in selected service, current branch and current organization (findByService):
      'service': service_id,
      'role': 4,

      //Exclude users with vacation true:
      'filter[professional.vacation]': false,

      //Only enabled users:
      'filter[status]': true
    };

    //Find by service reporting users (last true parameter):
    this.sharedFunctions.find('users', params, (res) => {
      //Check data:
      if(res.data.length > 0){
        //Set reporting users:
        this.reportingUsers = res.data;
      } else {
        //Clear previous values:
        this.reportingUsers = [];
        form.controls['reporting_user'].setValue('');

        //Send message:
        this.sharedFunctions.sendMessage('Advertencia: El servicio seleccionado NO tiene asignado ningún médico informador.');
      }
    }, false, 'findByService');
  }
  //--------------------------------------------------------------------------------------------------------------------//


  //--------------------------------------------------------------------------------------------------------------------//
  // FIND REFERENCES:
  //--------------------------------------------------------------------------------------------------------------------//
  findReferences(params: any = {}){
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
  //--------------------------------------------------------------------------------------------------------------------//


  //--------------------------------------------------------------------------------------------------------------------//
  // SAVE APPOINTMENT:
  //--------------------------------------------------------------------------------------------------------------------//
  saveAppointment(operation: string, form: FormGroup, fileManager: any, _id: string = '', keysWithValues: any = [], callback = (res: any) => {}){
    //Check operation type (Set flow state):
    let flow_state = 'A01';
    if(operation === 'update'){
      flow_state = form.value.flow_state;
    }

    //Check cancellation reasons value:
    if(flow_state !== 'A02'){
      //Delete to prevent validation backend error:
      delete form.value.cancellation_reasons;
    }

    //Initializate save object<:
    let appointmentSaveData: any = {};

    //Check if appointment is being saved from performing (Tab details update):
    if(this.sharedProp.element == 'performing'){
      //Performing case - Update appointment from tab details (Only domain data to facilitate RABC):
      appointmentSaveData = {
        imaging: {
          organization  : this.sharedProp.current_imaging.organization._id,
          branch        : this.sharedProp.current_imaging.branch._id,
          service       : this.sharedProp.current_imaging.service._id
        }
      };
    } else {
      //Normal case - Create save object (Set sharedProp current data):
      appointmentSaveData = {
        imaging: {
          organization  : this.sharedProp.current_imaging.organization._id,
          branch        : this.sharedProp.current_imaging.branch._id,
          service       : this.sharedProp.current_imaging.service._id
        },
        fk_patient    : this.sharedProp.current_patient._id,
        start         : this.sharedProp.current_datetime.start + '.000Z',
        end           : this.sharedProp.current_datetime.end + '.000Z',
        flow_state    : flow_state,
        fk_slot       : this.sharedProp.current_slot,
        fk_procedure  : this.sharedProp.current_procedure._id,
        urgency       : this.sharedProp.current_urgency
      };
    }

    //Check operation type (Set files references):
    if(operation === 'insert'){
      //Add uploaded files:
      if(Object.keys(fileManager.controller.informed_consent.files).length > 0){
        //Prevent: Cannot set properties of undefined:
        if(!appointmentSaveData.consents){ appointmentSaveData['consents'] = {}; }
        appointmentSaveData.consents['informed_consent'] = Object.keys(fileManager.controller.informed_consent.files)[0];
      }

      if(Object.keys(fileManager.controller.clinical_trial.files).length > 0){
        //Prevent: Cannot set properties of undefined:
        if(!appointmentSaveData.consents){ appointmentSaveData['consents'] = {}; }
        appointmentSaveData.consents['clinical_trial'] = Object.keys(fileManager.controller.clinical_trial.files)[0];
      }

      if(Object.keys(fileManager.controller.attached_files.files).length > 0){
        appointmentSaveData['attached_files'] = Object.keys(fileManager.controller.attached_files.files);
      }
    }

    //Merge Form Values in Appointments save data:
    let mergedValues = {
      ...appointmentSaveData,
      ...form.value
    };

    //Data normalization - Referring:
    mergedValues['referring'] = { organization: mergedValues.referring_organization };

    //Data normalization - Reporting:
    const reportingSplitted = mergedValues.reporting_domain.split('.');
    mergedValues['reporting'] = {
      organization  : reportingSplitted[0],
      branch        : reportingSplitted[1],
      service       : reportingSplitted[2]
    };

    //Data normalizarion - FK Reporting:
    if(mergedValues.reporting_user !== undefined && mergedValues.reporting_user !== null && mergedValues.reporting_user !== ''){
      mergedValues.reporting['fk_reporting'] = [mergedValues.reporting_user];
    }

    //Data normalization - Dates types:
    mergedValues.report_before = this.sharedFunctions.setDatetimeFormat(mergedValues.report_before);

    //Data normalization - Booleans types (mat-option cases):
    if(typeof mergedValues.outpatient != "boolean"){ mergedValues.outpatient = mergedValues.outpatient.toLowerCase() == 'true' ? true : false; }
    if(typeof mergedValues.contrast.use_contrast != "boolean"){ mergedValues.contrast.use_contrast = mergedValues.contrast.use_contrast.toLowerCase() == 'true' ? true : false; }
    if(mergedValues.status){ if(typeof mergedValues.status != "boolean"){ mergedValues.status = mergedValues.status.toLowerCase() == 'true' ? true : false; } }

    //Clean empty fields | Nested object cases - Check outpatient:
    if(mergedValues.outpatient === true){
      delete mergedValues.inpatient;
    }

    //Clean empty fields | Nested object cases - private_health.medication:
    if(mergedValues.private_health.medication !== undefined){
      if(mergedValues.private_health.medication.length == 0){
        delete mergedValues.private_health.medication;
      }
    }

    //Clean empty fields | Nested object cases - private_health.allergies:
    if(mergedValues.private_health.allergies !== undefined){
      if(mergedValues.private_health.allergies.length == 0){
        delete mergedValues.private_health.allergies;
      }
    }

    //Clean empty fields | Nested object cases - private_health.other:
    if(mergedValues.private_health.other !== undefined){
      if(mergedValues.private_health.other.length == 0){
        delete mergedValues.private_health.other;
      }
    }

    //Clean empty fields | Nested object cases - private_health.implants.other:
    if(mergedValues.private_health.implants.other !== undefined){
      if(mergedValues.private_health.implants.other.length == 0){
        delete mergedValues.private_health.implants.other;
      }
    }

    //Clean empty fields | Nested object cases - private_health.covid19.details:
    if(mergedValues.private_health.covid19.details !== undefined && mergedValues.private_health.covid19.details !== null){
      if(mergedValues.private_health.covid19.details.length == 0){
        delete mergedValues.private_health.covid19.details;
      }
    }

    //Delete temp values:
    delete mergedValues.referring_organization;
    delete mergedValues.reporting_domain;
    delete mergedValues.reporting_user;

    //Save data:
    this.sharedFunctions.save(operation, 'appointments', _id, mergedValues, keysWithValues, (res) => {
      //Delete appointment draft only if the operation was successful:
      if(res.success === true && operation === 'insert'){
        this.sharedFunctions.delete('single', 'appointments_drafts', this.sharedProp.current_appointment_draft);

        //Create appointment PDF with pain password:
        if(this.sharedProp.current_friendly_pass !== ''){
          this.pdfService.createPDF('appointment', res.data._id, this.sharedProp.current_friendly_pass, true);
        }

        //Response the form according to the result:
        this.sharedFunctions.formResponder(res, 'appointments', this.router);
      }

      //Execute callback:
      callback(res);
    });
  }
  //--------------------------------------------------------------------------------------------------------------------//
}
