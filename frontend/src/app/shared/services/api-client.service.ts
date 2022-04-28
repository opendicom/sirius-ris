import { Injectable } from '@angular/core';

//--------------------------------------------------------------------------------------------------------------------//
// IMPORTS:
//--------------------------------------------------------------------------------------------------------------------//
import { HttpClient } from '@angular/common/http';              // HTTPClient module
import { observable, Observable } from 'rxjs';                              // Reactive Extensions (RxJS)
import { environment } from '@env/environment';                 // Environment
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
    //Initialize response object:
    let response: any;

    //Set method:
    switch(method){
      case 'GET':
        response = this.http.get(environment.backend_url + path, { params: data });
        break;
      case 'POST':
        response = this.http.post(environment.backend_url + path, data);
        break;
    }

    //Return response:
    return response;
  }
  //--------------------------------------------------------------------------------------------------------------------//


  //--------------------------------------------------------------------------------------------------------------------//
  // GET REQUEST:
  //--------------------------------------------------------------------------------------------------------------------//
  getRequest(path: string, params: any): Observable<any> {
    //Return response:
    return this.http.get(environment.backend_url + path, { params: params });
  }
  //--------------------------------------------------------------------------------------------------------------------//


  //--------------------------------------------------------------------------------------------------------------------//
  // POST REQUEST:
  //--------------------------------------------------------------------------------------------------------------------//
  postRequest(path: string, post_data: any): Observable<any> {
    //Return response:
    return this.http.post(environment.backend_url + path, post_data);
  }
  //--------------------------------------------------------------------------------------------------------------------//
}
