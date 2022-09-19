import { Injectable } from '@angular/core';

//--------------------------------------------------------------------------------------------------------------------//
// IMPORTS:
//--------------------------------------------------------------------------------------------------------------------//
import { HttpInterceptor, HttpRequest, HttpHeaders, HttpHandler, HttpEvent } from '@angular/common/http'; // Interface HttpInterceptor
import { Observable } from 'rxjs';                                                                        // Reactive Extensions (RxJS)
import { SharedFunctionsService } from '@shared/services/shared-functions.service';                       // Shared Functions
//--------------------------------------------------------------------------------------------------------------------//

@Injectable({
  providedIn: 'root'
})
export class HttpInterceptorService implements HttpInterceptor {

  //Inject services to the constructor:
  constructor(private sharedFunctions: SharedFunctionsService){ }

  //Interface intercept method (HttpInterceptor):
  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    let jwt_token: any = 'JWT Empty';

    //Get JWT of localStorage:
    if(localStorage.getItem('sirius_auth')){
      //Get token:
      jwt_token = this.sharedFunctions.readToken();
    } else if(localStorage.getItem('sirius_temp')) {
      //Get temp token:
      jwt_token = this.sharedFunctions.readToken(true);
    }

    //Set Headers:
    const headers = new HttpHeaders({ 'Authorization': 'Bearer ' + jwt_token });

    //Clone request:
    const reqClone = req.clone({ headers });

    //Return the request:
    return next.handle(reqClone);
  }
}
