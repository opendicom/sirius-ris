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
  async authenticate(fk_report: string, password: string, callback = () => {}){
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
  // AMEND:
  //--------------------------------------------------------------------------------------------------------------------//
  amend(fk_report: string, callback = () => {}){
    //Set params:
    const params = { 
      'filter[_id]'                 : fk_report,
      'proj[clinical_info]'         : 1,
      'proj[procedure_description]' : 1,
      'proj[summary]'               : 1,
      'proj[findings]'              : 1,
      'proj[fk_performing]'         : 1,
      'proj[fk_pathologies]'        : 1
    };

    //Find report by _id:
    this.sharedFunctions.find('reports', params, (res) => {
      //Check result:
      if(res.success){
        //Set amendment report data (Clone objects with spread operator):
        const amendmentReport : any = {... res.data[0]};

        //Add amend field:
        amendmentReport['amend'] = 'true';

        //Remove _id (last report):
        delete amendmentReport._id;

        //Set operation data:
        const operationData = {
          operation: 'insert',
          element: 'reports',
          formData: amendmentReport
        }
        
        //Execute setted operation:
        this.execOperation(operationData, () => { callback() });
      } else {
        //Send error message:
        this.sharedFunctions.sendMessage(res.message);
      }
    }, false, false, false);
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
