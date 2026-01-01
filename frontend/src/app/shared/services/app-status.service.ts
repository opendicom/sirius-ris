import { Injectable } from '@angular/core';

//--------------------------------------------------------------------------------------------------------------------//
// IMPORTS:
//--------------------------------------------------------------------------------------------------------------------//
import { ApiClientService } from '@shared/services/api-client.service';                         // API Client Service
import { SharedFunctionsService } from '@shared/services/shared-functions.service';             // Shared Functions
//--------------------------------------------------------------------------------------------------------------------//

@Injectable({
  providedIn: 'root'
})
export class AppStatusService {
  
  //Inject services to the constructor:
  constructor(
    private apiClient : ApiClientService,
    public sharedFunctions  : SharedFunctionsService
  ) { }

  getAppStatus(callback = (res: any) => {}) {
    //Create observable obsStatus:
    const obsStatus = this.apiClient.sendRequest('GET', '?full_status=true', {});

    //Observe content (Subscribe):
    obsStatus.subscribe({
      next: res => {
        //Excecute optional callback with response:
        callback(res);
      },
      error: res => {
        //Send snakbar message:
        if(res.error.message){
          this.sharedFunctions.sendMessage(res.error.message);
        } else {
          this.sharedFunctions.sendMessage('Error: No se obtuvo respuesta del servidor backend.');
        }
      }
    });
  }
}
