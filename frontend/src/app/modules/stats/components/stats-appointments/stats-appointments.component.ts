import { Component, OnInit } from '@angular/core';

//--------------------------------------------------------------------------------------------------------------------//
// IMPORTS:
//--------------------------------------------------------------------------------------------------------------------//
import { SharedPropertiesService } from '@shared/services/shared-properties.service';       // Shared Properties
import { SharedFunctionsService } from '@shared/services/shared-functions.service';         // Shared Functions
//--------------------------------------------------------------------------------------------------------------------//

@Component({
  selector: 'app-stats-appointments',
  templateUrl: './stats-appointments.component.html',
  styleUrls: ['./stats-appointments.component.css']
})
export class StatsAppointmentsComponent implements OnInit {
  //Initialize appointmentsLocalResponse:
  public appointmentsStatsResponse: any = {};

  //Inject services to the constructor:
  constructor(
    public sharedProp       : SharedPropertiesService,
    public sharedFunctions  : SharedFunctionsService
  ){ }

  ngOnInit(): void {
  }

  onSearch(){
    //Set params:
    const params = {
      'start_date' : '2023-01-01',
      'end_date'   : '2023-12-31',
      'fk_organization' : '63adef4d6a897c00145903d3'
    };

    //Execute stats find:
    this.sharedFunctions.find('stats', params, async (res) => {
      //Check operation status:
      if(res.success === true){
        //Set data in local response:
        this.appointmentsStatsResponse = res.data;

        //Sort results by keys (await foreach):
        await Promise.all(Object.keys(this.appointmentsStatsResponse).map(key => {
          if(key !== 'total_items'){
            this.appointmentsStatsResponse[key] = Object.fromEntries(Object.entries(this.appointmentsStatsResponse[key]).sort());
          }
        }));
        
      } else {
        //Return to the list with request error message:
        this.sharedFunctions.sendMessage('Error al intentar obtener información: ' + res.message);
      }
    }, false, 'appointments', false);
  }
}
