import { Injectable } from '@angular/core';

//--------------------------------------------------------------------------------------------------------------------//
// IMPORTS:
//--------------------------------------------------------------------------------------------------------------------//
import { HttpClient } from '@angular/common/http';              // HTTPClient module
import { Observable } from 'rxjs';                              // Reactive Extensions (RxJS)
import { environment } from '@env/environment'; // Environment
//--------------------------------------------------------------------------------------------------------------------//

@Injectable({
  providedIn: 'root'
})
export class ApiClientService {

  //Inject services to the constructor:
  constructor(private http: HttpClient) { }

  //--------------------------------------------------------------------------------------------------------------------//
  // GET REQUEST:
  //--------------------------------------------------------------------------------------------------------------------//
  getRequest(element: string, operation: string, params: any): Observable<any> {
    //Return response:
    return this.http.get(environment.backend_url + element + '/' + operation, { params: params });
  }
  //--------------------------------------------------------------------------------------------------------------------//


  //--------------------------------------------------------------------------------------------------------------------//
  // POST REQUEST:
  //--------------------------------------------------------------------------------------------------------------------//
  postRequest(element: string, operation: string, post_data: any): Observable<any> {
    //Stringify POST Data:
    let string_json = JSON.stringify(post_data);

    //Return response:
    return this.http.post(environment.backend_url + element + '/' + operation, string_json);
  }
  //--------------------------------------------------------------------------------------------------------------------//
}
