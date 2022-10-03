import { Injectable } from '@angular/core';

//--------------------------------------------------------------------------------------------------------------------//
// IMPORTS:
//--------------------------------------------------------------------------------------------------------------------//
import { SharedFunctionsService } from '@shared/services/shared-functions.service';         // Shared Functions
import { FormGroup } from '@angular/forms';                                                 // Reactive form handling tools
import { Country, State, City }  from 'country-state-city';                                 // Country State City
import {                                                                                    // Enviroments
  app_setting,
} from '@env/environment';
//--------------------------------------------------------------------------------------------------------------------//

@Injectable({
  providedIn: 'root'
})
export class AppointmentsService {
  public settings         : any = app_setting;

  //Get Country State City information (Default settings):
  public allCountries   : any = Country.getAllCountries();
  public currentStates  : any = State.getStatesOfCountry(this.settings.default_country_isoCode);
  public currentCities  : any = City.getCitiesOfState(this.settings.default_country_isoCode, this.settings.default_state_isoCode);

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
    private sharedFunctions: SharedFunctionsService
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
      'rabc_exclude_code' : this.settings.rabc_exclude_code,
      'filter[status]'    : true
    };

    //Find organizations:
    this.sharedFunctions.find('organizations', params, (res) => {
      this.referringOrganizations = res.data;
    });
  }
  //--------------------------------------------------------------------------------------------------------------------//


  //--------------------------------------------------------------------------------------------------------------------//
  // FIND REPORTING USERS:
  //--------------------------------------------------------------------------------------------------------------------//
  findReportingUsers(service_id: string, form: FormGroup){
    //Set params:
    const params = {
      //Only people users:
      'filter[person.name_01]': '',
      'regex': true,

      //Only Doctors users in selected service:
      'filter[elemMatch][permissions][service]': service_id,
      'filter[elemMatch][permissions][role]': 4,

      //Exclude users with vacation true:
      'filter[professional.vacation]': false,

      //Only enabled users:
      'filter[status]': true
    };

    //Find reporting users:
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
    });
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
}
