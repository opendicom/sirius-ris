import { Injectable } from '@angular/core';

//--------------------------------------------------------------------------------------------------------------------//
// IMPORTS:
//--------------------------------------------------------------------------------------------------------------------//
import { SharedFunctionsService } from '@shared/services/shared-functions.service';           // Shared Functions
//--------------------------------------------------------------------------------------------------------------------//

@Injectable({
  providedIn: 'root'
})
export class ReportsService {

  //Inject services to the constructor:
  constructor(
    private sharedFunctions: SharedFunctionsService
  ) { }

  //--------------------------------------------------------------------------------------------------------------------//
  // SAVE:
  //--------------------------------------------------------------------------------------------------------------------//
  save(){

  }
  //--------------------------------------------------------------------------------------------------------------------//

  //--------------------------------------------------------------------------------------------------------------------//
  // SIGN:
  //--------------------------------------------------------------------------------------------------------------------//
  async sign(fk_report: string, password: string, callback = () => {}){
    //Set operation data:
    const operationData = {
      operation: 'insert',
      element: 'signatures',
      formData: {
        fk_report : fk_report,
        password  : password
      }
    }

    //Execute setted operation:
    this.execOperation(operationData, () => { callback() });
  }
  //--------------------------------------------------------------------------------------------------------------------//


  //--------------------------------------------------------------------------------------------------------------------//
  // AUTHENTICATE:
  //--------------------------------------------------------------------------------------------------------------------//
  authenticate(fk_report: string, password: string, callback = () => {}){
    //Set operation data:
    const operationData = {
      operation: 'authenticate',
      element: 'reports',
      formData: {
        _id       : fk_report,
        password  : password
      }
    }

    //Execute setted operation:
    this.execOperation(operationData, () => { callback() });
  }
  //--------------------------------------------------------------------------------------------------------------------//


  //--------------------------------------------------------------------------------------------------------------------//
  // EXEC OPERATION (DRY FUNCTION):
  //--------------------------------------------------------------------------------------------------------------------//
  execOperation(operationData: any, callback = () => {}){
    //Save data:
    this.sharedFunctions.save(operationData.operation, operationData.element, '', operationData.formData, [], (res) => {
      //Check result:
      if(res.success){
        //Send success mesage:
        this.sharedFunctions.sendMessage(res.message, { duration: 2000 });

        //Excecute callback:
        callback();

      } else {
        //Send error message:
        this.sharedFunctions.sendMessage(res.message);
      }
    }, false);
  }
  //--------------------------------------------------------------------------------------------------------------------//
}
