import { Injectable } from '@angular/core';

//--------------------------------------------------------------------------------------------------------------------//
// IMPORTS:
//--------------------------------------------------------------------------------------------------------------------//
import { SharedPropertiesService } from '@shared/services/shared-properties.service';       // Shared Properties
import { SharedFunctionsService } from '@shared/services/shared-functions.service';         // Shared Functions
import {                                                                                    // Enviroments
  appointments_flow_states,
  performing_flow_states,
  gender_types,
  cancellation_reasons
} from '@env/environment';
//--------------------------------------------------------------------------------------------------------------------//

@Injectable({
  providedIn: 'root'
})
export class StatsService {
  //Set service properties:
  public appointmentsFS       : any = appointments_flow_states;
  public performingFS         : any = performing_flow_states;
  public gender_types         : any = gender_types;
  public cancellation_reasons : any = cancellation_reasons;

  //Set references objects:
  public availableOrganizations : any;
  public availableBranches      : any;
  public availableUsers         : any;

  //Inject services to the constructor:
  constructor(  
    public sharedProp       : SharedPropertiesService,
    public sharedFunctions  : SharedFunctionsService
  ) { }

  //--------------------------------------------------------------------------------------------------------------------//
  // FIND STATS:
  //--------------------------------------------------------------------------------------------------------------------//
  findStats(statsDatasets: any, stats_element: string, params: any, statsCallback = (response: any, dataset: any) => {}){  
    //Execute stats find:
    this.sharedFunctions.find('stats', params, async (res) => {
      //Check operation status:
      if(res.success === true){
        //Set data in local response:
        const statsResponse = res.data;
          
        //Order result:
        await this.sharedFunctions.sortObject(statsResponse, ['total_items', 'anesthesia']);

        //Set Charts datasets:
        await Promise.all(Object.keys(statsDatasets).map(async (key: any) => {
          statsDatasets[key] = await this.getDataSet(statsResponse, key, stats_element);
        }));

        //Execute callback:
        statsCallback(statsResponse, statsDatasets);
      } else {
        //Return to the list with request error message:
        this.sharedFunctions.sendMessage('Error al intentar obtener información: ' + res.message);
      }
    }, false, stats_element, false);
  }
  //--------------------------------------------------------------------------------------------------------------------//


  //--------------------------------------------------------------------------------------------------------------------//
  // GET DATASET:
  //--------------------------------------------------------------------------------------------------------------------//
  async getDataSet(statsRespone: any, chart_name: string, stats_element: string){
    //Initializate dataset:
    let current_dataset: any = [];
  
    //Loop in response object (await foreach):
    await Promise.all(Object.keys(statsRespone).map(async key => {
      //Check chart name:
      if(key == chart_name){
        //Add current element in current dataset (await foreach):
        await Promise.all(Object.keys(statsRespone[key]).map(async element_key => {
          //Initialize key_name:
          let key_name = element_key;

          //Change key names:
          switch(key){
            case 'flow_state':
              //Check current stats element:
              switch(stats_element){ 
                case 'appointments':
                  key_name = this.appointmentsFS[element_key];
                  break;

                case 'performing':
                  key_name = this.performingFS[element_key];
                  break;
              }
              break;

            case 'urgency':
              key_name = element_key == 'true' ? 'Urgente' : 'Común';
              break;

            case 'outpatient':
              key_name = element_key == 'true' ? 'Ambulatorio' : 'Internado';
              break;

            case 'gender':
              key_name = this.gender_types[element_key];
              break;
            
            case 'cancellation_reasons':
              key_name = this.cancellation_reasons[element_key];
              break;

            case 'injection_user':
            case 'laboratory_user':
            case 'console_technician':
              //Change _id to name in key (await foreach):
              await Promise.all(Object.keys(this.availableUsers).map(async currentUserKey => {
                if(this.availableUsers[currentUserKey]._id == key_name){
                  //Set name/s:
                  let names = this.availableUsers[currentUserKey].person.name_01;
                  if(this.availableUsers[currentUserKey].person.name_02){
                    names += ' ' + this.availableUsers[currentUserKey].person.name_01
                  }

                  //Set surname/s:
                  let surnames = this.availableUsers[currentUserKey].person.surname_01;
                  if(this.availableUsers[currentUserKey].person.surname_02){
                    surnames += ' ' + this.availableUsers[currentUserKey].person.surname_01
                  }

                  //Set complete name:
                  key_name = names + ' ' + surnames;
                }
              }));
              break;
          }

          //Add current element in dataset:
          current_dataset.push({ name: key_name, value: statsRespone[key][element_key]});
        }));
      }
    }));
  
    //Return current dataset:
    return current_dataset;
  }
  //--------------------------------------------------------------------------------------------------------------------//


  //--------------------------------------------------------------------------------------------------------------------//
  // FIND REFERENCES:
  //--------------------------------------------------------------------------------------------------------------------//
  findReferences(){
    //Set params:
    const params = { 'filter[status]': true };

    //Find organizations:
    this.sharedFunctions.find('organizations', params, (res) => {
      this.availableOrganizations = res.data;
    });

    //Find branches:
    this.sharedFunctions.find('branches', params, (res) => {
      this.availableBranches = res.data;
    });

    //Find stats users:
    this.findStatUsers(res => { this.availableUsers = res.data; });
  }
  //--------------------------------------------------------------------------------------------------------------------//


  //--------------------------------------------------------------------------------------------------------------------//
  // FIND STAT USERS:
  //--------------------------------------------------------------------------------------------------------------------//
  findStatUsers(callback = (res: any) => {}){
    //Set params:
    const params = {
      //Only people users:
      'filter[person.name_01]': '',
      'regex': true,

      //Tecnicos & Enfermeros:
      'filter[in][permissions.role]': [5, 6],

      //Projection:
      'proj[person.name_01]'    : 1,
      'proj[person.name_02]'    : 1,
      'proj[person.surname_01]' : 1,
      'proj[person.surname_02]' : 1
    };

    //Find users:
    this.sharedFunctions.find('users', params, (res) => {
      //Check response:
      if(res.success == true){
        //Execute callback:
        callback(res);
      } else {
        //Send message:
        this.sharedFunctions.sendMessage('Error al intentar obtener los usuarios involucrados en la estadística.');
      }
    }, false, false, false);
  }
  //--------------------------------------------------------------------------------------------------------------------//
}
