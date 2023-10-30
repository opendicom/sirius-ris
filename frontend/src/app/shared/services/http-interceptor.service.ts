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
  // SIMPLE CRYPT:
  // Duplicated method to prevent circular dependency - [Duplicated method: shared-functions.service].
  //--------------------------------------------------------------------------------------------------------------------//
  simpleCrypt (message: string): string {
    //Initialize secret number with default value until file content is loaded:
    let secret_number = 1618;

    //Set secret number with file settings:
    if(this.fileSettingsService.mainSettings !== undefined && this.fileSettingsService.mainSettings.appSettings !== undefined){
      secret_number = this.fileSettingsService.mainSettings.appSettings.secret_number;
    }
    
    //Encode:
    let encoded = '';
    for (let i=0; i < message.length; i++) {
      let a = message.charCodeAt(i);
      let b = a ^ secret_number;
      encoded = encoded+String.fromCharCode(b);
    }
    return encoded;
  }
  //--------------------------------------------------------------------------------------------------------------------//
}
