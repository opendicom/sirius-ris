import { Injectable } from '@angular/core';

//--------------------------------------------------------------------------------------------------------------------//
// IMPORTS:
//--------------------------------------------------------------------------------------------------------------------//
import { SharedPropertiesService } from '@shared/services/shared-properties.service';       // Shared Properties
import { SharedFunctionsService } from '@shared/services/shared-functions.service';         // Shared Functions
import {                                                                                    // Enviroments
  appointments_flow_states,
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
  public gender_types         : any = gender_types;
  public cancellation_reasons : any = cancellation_reasons;

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
        await this.sharedFunctions.sortObject(statsResponse, ['total_items']);

        //Set Charts datasets:
        await Promise.all(Object.keys(statsDatasets).map(async (key: any) => {
          statsDatasets[key] = await this.getDataSet(statsResponse, key);
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
  async getDataSet(statsRespone: any, chart_name: string){
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
              key_name = this.appointmentsFS[element_key];
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
}
