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
      this.userLoginError('Backend message: ' + res.message);
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
  // USER LOGIN:
  //--------------------------------------------------------------------------------------------------------------------//
  userLogin(form_data: NgForm): any {
    //Create authentication object:
    let siriusAuth: any = {};

    //Set query parameters:
    const people_params: any =  {
      //Filter:
      'filter[documents.doc_country_code]': form_data.value.doc_country_code,
      'filter[documents.doc_type]': form_data.value.doc_type,
      'filter[documents.document]': form_data.value.document,

      //Projection:
      'proj[phone_numbers]': 0,
      'proj[email]': 0,
      'proj[gender]': 0,
      'proj[createdAt]': 0,
      'proj[updatedAt]': 0,
      'proj[__v]': 0,
    };

    let users_params: any = {};
    let check_pass_params: any = {};

    //Create observable obsJWTLogin:
    //const obsJWTLogin = this.apiClient.jwtLogin();

    //Create observable obsUserLogin:
    /*
    const obsUserLogin = obsJWTLogin.pipe(
      //Check JWT authentication:
      map((res: any) => { return this.setToken(res, siriusAuth); }),

      //Filter that only success cases continue:
      filter((res: any) => res.success === true),

      //Search for a person with the indicated document (Return observable):
      mergeMap(() => this.apiClient.getRequest('people', 'findOne', people_params)),

      //If there is a person, save data in session object:
      map((res: any) => {
        //Check operation status:
        if(res.success === true){

          //Check existence of person with the entered document (Result NOT empty):
          if(Object.keys(res.data).length !== 0){

            //Set person data into authentication object:
            siriusAuth['people_id']  = res.data._id;
            siriusAuth['documents']  = res.data.documents;
            siriusAuth['name_01']    = res.data.name_01;
            siriusAuth['surname_01'] = res.data.surname_01;
            siriusAuth['birth_date'] = res.data.birth_date;

            //Determine id parameter (fk_person), to query user:
            users_params = {
              'filter[fk_people]': siriusAuth.people_id,
              'proj[password]': 0,
              'proj[createdAt]': 0,
              'proj[updatedAt]': 0,
              'proj[__v]': 0,
            }
          } else {
            //Send message into screen:
            this.userLoginError('No se encontró ninguna persona con el documento ingresado.');
          }
        } else {
          //Send message into screen:
          this.userLoginError('Backend message: ' + res.message);
        }

        //Return response:
        return res;
      }),

      //Filter that only success cases and NOT empty results continue:
      filter((res: any) => res.success === true && Object.keys(res.data).length !== 0),

      //Query user (Return observable):
      mergeMap(() => this.apiClient.getRequest('users', 'findOne', users_params)),

      //Check if user exist and status == true:
      map((res: any) => {

        //Check operation status:
        if(res.success === true){

          //Check existence of user with the entered id (Result NOT empty):
          if(Object.keys(res.data).length !== 0){

            //Check user status:
            if(res.data.status === true) {

              //Set user data into authentication object:
              siriusAuth['user_id']    = res.data._id;
              siriusAuth['privileges'] = res.data.privileges;

              //Determine parameters to query check password:
              check_pass_params = {
                'id': siriusAuth.user_id,
                'password': form_data.value.password,
              }

            } else {
              //Send message into screen:
              this.userLoginError('El documento ingresado corresponde a un usuario inactivo.');
            }
          } else {
            //Send message into screen:
            this.userLoginError('No se encuentra un usuario asociado al documento ingresado.');
          }
        } else {
          //Send message into screen:
          this.userLoginError('Backend message: ' + res.message);
        }

        //Return response:
        return res;
      }),

      //Filter that only success cases, NOT empty results and active users continue:
      filter((res: any) => res.success === true && Object.keys(res.data).length !== 0 && res.data.status === true),

      //Password attribute check query (Return observable):
      mergeMap(() => this.apiClient.postRequest('users', 'checkPassById', check_pass_params)),

      //Handle checkPassById response:
      map((res: any) => {
        //Check user password:
        if(res.success === true){

          //Remove previous temp token:
          this.removeToken();

          //Stringify final authentication object:
          const final_siriusAuth = JSON.stringify(siriusAuth);

          //Crypt stringify object and create local file:
          localStorage.setItem('sirius_auth', this.sharedFunctions.simpleCrypt(final_siriusAuth));

          //Send message into screen (Password match - Login successfully):
          this.snackBar.open('¡Autenticación exitosa!', '', {
            duration: 2000
          });

          //Redirect to Start Page:
          this.router.navigate(['/start']);
        } else {
          //Send message into screen (Wrong password):
          this.userLoginError(res.message);
        }

        //Return response:
        return res;
      }),
    );

    //Observe content (Subscribe):
    obsUserLogin.subscribe();
    */
  }
  //--------------------------------------------------------------------------------------------------------------------//


  //--------------------------------------------------------------------------------------------------------------------//
  // USER LOGOUT:
  //--------------------------------------------------------------------------------------------------------------------//
  userLogout(): void{
    this.removeToken();
    this.router.navigate(['/auth/login']);
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
  // USER LOGIN ERROR:
  //--------------------------------------------------------------------------------------------------------------------//
  private userLoginError(message: string): void{
    this.snackBar.open(message, 'ACEPTAR');
    this.removeToken();
  }
  //--------------------------------------------------------------------------------------------------------------------//
}
