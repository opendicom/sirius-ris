import { Injectable } from '@angular/core';

//--------------------------------------------------------------------------------------------------------------------//
// IMPORTS:
//--------------------------------------------------------------------------------------------------------------------//
import { app_setting } from '@env/environment';                               // Environment
import { MatSnackBar } from '@angular/material/snack-bar';                    // SnackBar (Angular Material)
import { BaseElementService } from '@shared/services/base-element.service';   // Base Element
//--------------------------------------------------------------------------------------------------------------------//

@Injectable({
  providedIn: 'root'
})
export class SharedFunctionsService {

  constructor(private snackBar: MatSnackBar, private objSubElement: BaseElementService) { }

  //--------------------------------------------------------------------------------------------------------------------//
  // SIMPLE CRYPT:
  //--------------------------------------------------------------------------------------------------------------------//
  simpleCrypt (message: string): string {
    const secret_number = app_setting.secret_number;
    let encoded = '';
    for (let i=0; i < message.length; i++) {
      let a = message.charCodeAt(i);
      let b = a ^ secret_number;
      encoded = encoded+String.fromCharCode(b);
    }
    return encoded;
  }
  //--------------------------------------------------------------------------------------------------------------------//


  //--------------------------------------------------------------------------------------------------------------------//
  // GET KEYS:
  //--------------------------------------------------------------------------------------------------------------------//
  getKeys(object: any, sort: boolean) {
    if(sort){
      return Object.keys(object).sort();
    } else {
      return Object.keys(object);
    }
  };
  //--------------------------------------------------------------------------------------------------------------------//


  //--------------------------------------------------------------------------------------------------------------------//
  // READ TOKEN:
  //--------------------------------------------------------------------------------------------------------------------//
  readToken(): string {
    let siriusAuth: any;

    //Get encoded local file content:
    siriusAuth = localStorage.getItem('sirius_auth');

    //Decode content:
    siriusAuth = this.simpleCrypt(siriusAuth);

    //Parse to JS object:
    siriusAuth = JSON.parse(siriusAuth);

    //Get token:
    return siriusAuth.jwt;
  }
  //--------------------------------------------------------------------------------------------------------------------//


  //--------------------------------------------------------------------------------------------------------------------//
  // GET USER INFO:
  //--------------------------------------------------------------------------------------------------------------------//
  getUserInfo(): any {
    let siriusAuth: any;

    //Get encoded local file content:
    siriusAuth = localStorage.getItem('sirius_auth');

    //Decode content:
    siriusAuth = this.simpleCrypt(siriusAuth);

    //Parse to JS object:
    siriusAuth = JSON.parse(siriusAuth);

    //Delete object's JWT property:
    delete siriusAuth.jwt;

    //Get authentication object without token (No JWT):
    return siriusAuth;
  }
  //--------------------------------------------------------------------------------------------------------------------//


  //--------------------------------------------------------------------------------------------------------------------//
  // CLEAN EMPTY FIELDS:
  //--------------------------------------------------------------------------------------------------------------------//
  cleanEmptyFields(obj: any) {
    //Iterate over the object:
    Object.keys(obj).forEach(function(key){
      //Delete empty fields:
      if (obj[key] === null || obj[key] === undefined || obj[key] === '') {
        delete obj[key];
      }
    });
  }
  //--------------------------------------------------------------------------------------------------------------------//


  //--------------------------------------------------------------------------------------------------------------------//
  // GET DATE BACKEND FORMAT:
  //--------------------------------------------------------------------------------------------------------------------//
  getDateBackendFormat(date: Date): string {
    //Fix Eastern Daylight Time (TimezoneOffset):
    date.getTimezoneOffset();

    //Set format date:
    return date.getFullYear() + "-" + (date.getMonth() + 1) + "-" + date.getDate();
  }
  //--------------------------------------------------------------------------------------------------------------------//


  //--------------------------------------------------------------------------------------------------------------------//
  // GET TIME BACKEND FORMAT:
  //--------------------------------------------------------------------------------------------------------------------//
  getTimeBackendFormat(time: Date): string {
    return time.getHours() + ":" + time.getMinutes() + ":" + time.getSeconds();
  }
  //--------------------------------------------------------------------------------------------------------------------//


  //--------------------------------------------------------------------------------------------------------------------//
  // SEND MESSAGE:
  //--------------------------------------------------------------------------------------------------------------------//
  sendMessage(message: string): void {
    this.snackBar.open(message, 'ACEPTAR');
  }
  //--------------------------------------------------------------------------------------------------------------------//


  //--------------------------------------------------------------------------------------------------------------------//
  // SIMPLE JOIN:
  //--------------------------------------------------------------------------------------------------------------------//
  simpleJoin(sub_element: string, fk_name: string, res: any, _matrix_pointer: any): any {
    //Set sub-elements:
    this.objSubElement.setElement(sub_element);

    //Iterate over results:
    for(let i=0; i<res.data.length; i++){

      //If the sub element is not a person and has a type other than 1 (human) [User machine case do not enter]:
      if(!(sub_element == 'people' && res.data[i].type != 1)){

        //Set sub-element params:
        let sub_params: any =  {
          'filter[_id]': res.data[i][fk_name],
          'proj[createdAt]': 0,
          'proj[updatedAt]': 0,
          'proj[__v]': 0,
        };

        //Observe sub-element content (Subscribe):
        this.objSubElement.find(sub_params, true).subscribe({
          next: (sub_res) => {
            //Iterate over the api_response object (search of the sub-element corresponding to the id):
            Object.keys(_matrix_pointer[0].data).forEach((key) => {
              if(_matrix_pointer[0].data[key][fk_name] == sub_res.data._id){

                //Add sub_element data to object:
                _matrix_pointer[0].data[key][sub_element] = sub_res.data;

                //Remove foreign key from object (redundant):
                delete _matrix_pointer[0].data[key][fk_name];
              }
            });
          },
          error: (sub_res) => {
            //Send snakbar message:
            this.sendMessage(sub_res.error.message);
          }
        });
      }
    }
  }
  //--------------------------------------------------------------------------------------------------------------------//
}
