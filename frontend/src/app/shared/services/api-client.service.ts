import { Injectable } from '@angular/core';

//--------------------------------------------------------------------------------------------------------------------//
// IMPORTS:
//--------------------------------------------------------------------------------------------------------------------//
import { HttpClient } from '@angular/common/http';    // HTTPClient module
import { Observable } from 'rxjs';                    // Reactive Extensions (RxJS)
import { app_setting } from '@env/environment';       // Environment
//--------------------------------------------------------------------------------------------------------------------//

@Injectable({
  providedIn: 'root'
})
export class ApiClientService {

  //Inject services to the constructor:
  constructor(private http: HttpClient) { }

  //--------------------------------------------------------------------------------------------------------------------//
  // SEND REQUEST:
  //--------------------------------------------------------------------------------------------------------------------//
  sendRequest(method: string, path: string, data: any): Observable<any> {
    //Set backend URL:
    const backend_url = app_setting.backend_url;

    //Initialize response object:
    let response: any;

    //Set method:
    switch(method){
      case 'GET':
        response = this.http.get(backend_url + path, { params: data });
        break;
      case 'POST':
        response = this.http.post(backend_url + path, data);
        break;
    }

    //Return response:
    return response;
  }
  //--------------------------------------------------------------------------------------------------------------------//

}
