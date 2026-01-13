import { Injectable } from '@angular/core';

//--------------------------------------------------------------------------------------------------------------------//
// IMPORTS:
//--------------------------------------------------------------------------------------------------------------------//
import { ApiClientService } from '@shared/services/api-client.service';                         // API Client Service
import { SharedFunctionsService } from '@shared/services/shared-functions.service';             // Shared Functions
import { I18nService } from '@shared/services/i18n.service';                                    // I18n Service
//--------------------------------------------------------------------------------------------------------------------//

@Injectable({
  providedIn: 'root'
})
export class AppStatusService {
  
  //Inject services to the constructor:
  constructor(
    private apiClient : ApiClientService,
    public sharedFunctions  : SharedFunctionsService,
    public i18n : I18nService
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
          this.sharedFunctions.sendMessage(this.i18n.instant('SHARED.BACKEND_NO_RESPONSE_ERROR'));
        }
      }
    });
  }
}
