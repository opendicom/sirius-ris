import { Injectable } from '@angular/core';

//--------------------------------------------------------------------------------------------------------------------//
// IMPORTS:
//--------------------------------------------------------------------------------------------------------------------//
import { ApiClientService } from '@shared/services/api-client.service';       // API Client Service
import { app_setting } from '@env/environment';                               // Environment
import { MatSnackBar } from '@angular/material/snack-bar';                    // SnackBar (Angular Material)
//--------------------------------------------------------------------------------------------------------------------//

@Injectable({
  providedIn: 'root'
})
export class SharedFunctionsService {
  public response: any = {};

  constructor(
    private apiClient: ApiClientService,
    private snackBar: MatSnackBar
  ) { }

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
  readToken(tmp: Boolean = false): string {
    let siriusAuth: any;
    let fileName: String;

    //Set file name:
    if(tmp){
      fileName = 'sirius_temp';
    } else {
      fileName = 'sirius_auth';
    }

    //Get encoded local file content:
    siriusAuth = localStorage.getItem(fileName.toString());

    //Decode content:
    siriusAuth = this.simpleCrypt(siriusAuth);

    //Parse to JS object:
    siriusAuth = JSON.parse(siriusAuth);

    //Get token:
    return siriusAuth.token;
  }
  //--------------------------------------------------------------------------------------------------------------------//


  //--------------------------------------------------------------------------------------------------------------------//
  // GET USER INFO:
  //--------------------------------------------------------------------------------------------------------------------//
  getUserInfo(tmp: Boolean = false): any {
    let siriusAuth: any;
    let fileName: String;

    //Set file name:
    if(tmp){
      fileName = 'sirius_temp';
    } else {
      fileName = 'sirius_auth';
    }

    //Get encoded local file content:
    siriusAuth = localStorage.getItem(fileName.toString());

    //Decode content:
    siriusAuth = this.simpleCrypt(siriusAuth);

    //Parse to JS object:
    siriusAuth = JSON.parse(siriusAuth);

    //Delete object's token property:
    delete siriusAuth.token;

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
  // FIND:
  //--------------------------------------------------------------------------------------------------------------------//
  find(element: string, params: any): void{
    //Create observable obsFind:
    const obsFind = this.apiClient.sendRequest('GET', element + '/find', params);

    //Observe content (Subscribe):
    obsFind.subscribe({
      next: res => {
        this.response = res;
      },
      error: res => {
        //Send snakbar message:
        alert(res.error.message);
      }
    });
  }
  //--------------------------------------------------------------------------------------------------------------------//


  //--------------------------------------------------------------------------------------------------------------------//
  // ON SEARCH:
  //--------------------------------------------------------------------------------------------------------------------//
  onSearch(element: string, params: any){
    const new_params = {
      //Filter:
      'filter[code_value]': 'RM',

      //Projection:
      'proj[createdAt]': 0,
      'proj[updatedAt]': 0,
      'proj[__v]': 0,

      //Sort:
      'sort[status]' : -1,

      //Pager:
      'pager[page_number]': 1,
      'pager[page_limit]': 10,
    };

    console.log(params);

    this.find(element, new_params);
  }
  //--------------------------------------------------------------------------------------------------------------------//
}
