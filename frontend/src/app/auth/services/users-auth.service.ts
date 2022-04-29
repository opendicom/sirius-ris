import { Injectable } from '@angular/core';

//--------------------------------------------------------------------------------------------------------------------//
// IMPORTS:
//--------------------------------------------------------------------------------------------------------------------//
import { map, filter, mergeMap } from 'rxjs/operators';                                         // Reactive Extensions (RxJS)
import { NgForm } from '@angular/forms';                                                        // For bidirectional binding (NgForm).
import { SharedFunctionsService } from '@shared/services/shared-functions.service';             // Shared Functions
import { ApiClientService } from '@shared/services/api-client.service';                         // API Client Service
import { MatSnackBar } from '@angular/material/snack-bar';                                      // SnackBar (Angular Material)
import { Router } from '@angular/router';                                                       // Router
import { JwtHelperService } from "@auth0/angular-jwt";                                          // JWT Helper Service (Check JWT Expiration)
//--------------------------------------------------------------------------------------------------------------------//

//Create helper object:
const helper = new JwtHelperService();

@Injectable({
  providedIn: 'root'
})
export class UsersAuthService {

  //Inject services to the constructor:
  constructor(
    private router: Router,
    private apiClient: ApiClientService,
    private sharedFunctions: SharedFunctionsService,
    private snackBar: MatSnackBar,
  ) { }


  //--------------------------------------------------------------------------------------------------------------------//
  // SET TOKEN:
  //--------------------------------------------------------------------------------------------------------------------//
  private setToken(res: any, siriusAuth: any): any{
    //Check operation status:
    if(res.success === true){
      //Set authentication object:
      siriusAuth['jwt']  = res.token;

      //Stringify object:
      siriusAuth = JSON.stringify(siriusAuth);

      //Crypt stringify object and create local file:
      localStorage.setItem('sirius_auth', this.sharedFunctions.simpleCrypt(siriusAuth));
    } else {
      //Send message into screen:
      this.userSigninError('Backend message: ' + res.message);
    }

    //Return response:
    return res;
  }
  //--------------------------------------------------------------------------------------------------------------------//


  //--------------------------------------------------------------------------------------------------------------------//
  // REMOVE TOKEN:
  //--------------------------------------------------------------------------------------------------------------------//
  public removeToken(): void{
    //Delete token:
    localStorage.removeItem('sirius_auth');
  }
  //--------------------------------------------------------------------------------------------------------------------//


  //--------------------------------------------------------------------------------------------------------------------//
  // USER SIGNIN:
  //--------------------------------------------------------------------------------------------------------------------//
  userSignin(form_data: NgForm): any {
    //Create authentication object:
    let siriusAuth: any = {};

    //Initialize tmpToken string (For users with multiple permissions):
    let tmpToken = '';

    //Create observable obsSignin:
    const obsSignin = this.apiClient.sendRequest('POST', 'signin', form_data.value);

    //Create observable obsUserSignin:
    const obsUserSignin = obsSignin.pipe(
      map((res: any) => {
        //Check operation status:
        if(res.success === true){

          //If user signin with only one permission:
          if(Object.keys(res.data.permissions).length == 1){
            //Set user data into authentication object:
            siriusAuth = res.data;

            //Add session token (1 day), into authentication object:
            siriusAuth.token = res.token;

            //Stringify final authentication object:
            const final_siriusAuth = JSON.stringify(siriusAuth);

            //Crypt stringify object and create local file:
            localStorage.setItem('sirius_auth', this.sharedFunctions.simpleCrypt(final_siriusAuth));

            //Send message into screen (Password match - Signin successfully):
            this.snackBar.open(res.message, '', {
              duration: 2000
            });

            //Redirect to Start Page:
            this.router.navigate(['/start']);

          //Multiple permissions:
          } else {
            //Set user data into authentication object:
            siriusAuth = res.data;

            //Set autorization token (1 minute):
            tmpToken = res.token;

            //Redirect to Authorize Page:
            this.router.navigate(['/signin/authorize']);
          }
        } else {
          //Send message into screen:
          this.userSigninError(res.message);
        }

        //Return response:
        return res;
      }),

      //Filter that only success cases and users with multiple permissions continue:
      filter((res: any) => res.success === true && Object.keys(res.data.permissions).length > 1),

      //Authorize user with multiple permissions:
      //mergeMap(() => this.apiClient.sendRequest('POST', 'signin/authorize', form_data.value)),
    );

    //Observe content (Subscribe):
    obsUserSignin.subscribe({
      next: data => console.log(data),
      error: error => console.error(`Error: ${error}`),
      complete: () => console.log('Suscripción finalizada')
    });
  }
  //--------------------------------------------------------------------------------------------------------------------//


  //--------------------------------------------------------------------------------------------------------------------//
  // USER LOGOUT:
  //--------------------------------------------------------------------------------------------------------------------//
  userLogout(): void{
    this.removeToken();
    this.router.navigate(['/signin']);
  }
  //--------------------------------------------------------------------------------------------------------------------//


  //--------------------------------------------------------------------------------------------------------------------//
  // USER IS LOGGED:
  //--------------------------------------------------------------------------------------------------------------------//
  userIsLogged(): boolean {
    //Get JWT of localStorage:
    if(localStorage.getItem('sirius_auth')){
      //Get token & check if is expired:
      const jwt_token = this.sharedFunctions.readToken();
      const isExpired = helper.isTokenExpired(jwt_token);

      if (isExpired) {
        this.userLogout();
        return false;
      } else {
        return true;
      }
    } else {
      this.userLogout();
      return false;
    }
  }
  //--------------------------------------------------------------------------------------------------------------------//


  //--------------------------------------------------------------------------------------------------------------------//
  // USER SIGNIN ERROR:
  //--------------------------------------------------------------------------------------------------------------------//
  private userSigninError(message: string): void{
    this.snackBar.open(message, 'ACEPTAR');
    this.removeToken();
  }
  //--------------------------------------------------------------------------------------------------------------------//
}
