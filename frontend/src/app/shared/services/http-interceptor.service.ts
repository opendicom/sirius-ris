import { Injectable } from '@angular/core';

//--------------------------------------------------------------------------------------------------------------------//
// IMPORTS:
//--------------------------------------------------------------------------------------------------------------------//
import { HttpInterceptor, HttpRequest, HttpHeaders, HttpHandler, HttpEvent } from '@angular/common/http'; // Interface HttpInterceptor
import { Observable } from 'rxjs';                                                                        // Reactive Extensions (RxJS)
import { FileSettingsService } from '@shared/services/file-settings.service';                             // File Settings Service
//--------------------------------------------------------------------------------------------------------------------//

@Injectable({
  providedIn: 'root'
})
export class HttpInterceptorService implements HttpInterceptor {

  //Inject services to the constructor:
  constructor(private fileSettingsService: FileSettingsService){}

  //Interface intercept method (HttpInterceptor):
  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    let jwt_token: any = 'JWT Empty';

    //Get JWT of localStorage:
    if(localStorage.getItem('sirius_auth')){
      //Get token:
      jwt_token = this.readToken();
    } else if(localStorage.getItem('sirius_temp')) {
      //Get temp token:
      jwt_token = this.readToken(true);
    }

    //Set Headers:
    const headers = new HttpHeaders({ 'Authorization': 'Bearer ' + jwt_token });

    //Clone request:
    const reqClone = req.clone({ headers });

    //Return the request:
    return next.handle(reqClone);
  }

  //--------------------------------------------------------------------------------------------------------------------//
  // READ TOKEN:
  // Duplicated method to prevent circular dependency - [Duplicated method: shared-functions.service].
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

    //Decode file:
    siriusAuth = this.decodeFile(fileName.toString());

    //Get token:
    return siriusAuth.token;
  }
  //--------------------------------------------------------------------------------------------------------------------//

  //--------------------------------------------------------------------------------------------------------------------//
  // SIMPLE CRYPT:
  // Duplicated method to prevent circular dependency - [Duplicated method: shared-functions.service].
  //--------------------------------------------------------------------------------------------------------------------//
  simpleCrypt (message: string): string {
    //Encode:
    let encoded = '';
    for (let i=0; i < message.length; i++) {
      let a = message.charCodeAt(i);
      let b = a ^ 1618;
      encoded = encoded+String.fromCharCode(b);
    }
    return encoded;
  }
  //--------------------------------------------------------------------------------------------------------------------//

  
  //--------------------------------------------------------------------------------------------------------------------//
  // DECODE LOCAL FILE:
  // [Duplicated method: shared-functions.service].
  //--------------------------------------------------------------------------------------------------------------------//
  decodeFile(fileName: string): any{
    let objFile: any;

    //Get encoded local file content:
    objFile = localStorage.getItem(fileName);

    //Decode content:
    objFile = this.simpleCrypt(objFile);

    //Parse to JS object:
    objFile = JSON.parse(objFile);

    //Return decoded and parsed object:
    return objFile;
  }
  //--------------------------------------------------------------------------------------------------------------------//
}
