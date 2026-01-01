import { Component, OnInit } from '@angular/core';

//--------------------------------------------------------------------------------------------------------------------//
// IMPORTS:
//--------------------------------------------------------------------------------------------------------------------//
import { ActivatedRoute } from '@angular/router';                                       // Activated Route Interface (To get information about the routes)
import { NgForm } from '@angular/forms';                                                // NgForm (bidirectional binding)
import { UsersAuthService } from '@auth/services/users-auth.service';                   // Users Auth Service
import { SharedPropertiesService } from '@shared/services/shared-properties.service';   // Shared Properties
import { SharedFunctionsService } from '@shared/services/shared-functions.service';     // Shared Functions
import { ThemesService } from '@shared/services/themes.service';                        // Themes Service
import { I18nService } from '@shared/services/i18n.service';                            // I18n Service
import { ISO_3166, objectKeys } from '@env/environment';                                // Enviroments
//--------------------------------------------------------------------------------------------------------------------//

@Component({
  selector: 'app-signin',
  templateUrl: './signin.component.html',
  styleUrls: ['./signin.component.css']
})
export class SigninComponent implements OnInit {
  public country_codes: any = ISO_3166;
  public documentTypesKeys: string[] = objectKeys.documentTypesKeys;

  //Re-define method in component to use in HTML view:
  public getKeys: any;

  //Initializate full status information and theme controllers:
  public GET_full_status: any = false;
  public GET_initial_forced_theme: any = undefined;

  //Create unsorted function to prevent Angular from sorting 'wrong' ngFor keyvalue:
  unsorted = () => { return 0 }

  //Inject services to the constructor:
  constructor(
    private userAuth        : UsersAuthService,
    public  sharedProp      : SharedPropertiesService,
    private sharedFunctions : SharedFunctionsService,
    private objRoute        : ActivatedRoute,
    public  themesService   : ThemesService,
    public  i18n            : I18nService
  ) {
    //Pass Service Method:
    this.getKeys = this.sharedFunctions.getKeys;
  }

  ngOnInit(): void {
    //Extract sent data (GET parameters):
    this.GET_full_status = this.sharedFunctions.stringToBoolean(this.objRoute.snapshot.queryParams['full_status']);
    this.GET_initial_forced_theme = this.objRoute.snapshot.queryParams['theme'];

    //Check full status info:
    if(this.GET_full_status){
      //Remove token manually (Prevent redirect to /signin without GET params):
      this.userAuth.removeToken();
    } else {
      //Logout if is entered in this component:
      this.userAuth.userLogout();

      //Refresh isLoged value not display the toolbar and sidebar:
      this.sharedProp.checkIsLogged();
    }

    // Initializate or Force CSS theme (Initial):
    if(this.GET_initial_forced_theme !== undefined && this.GET_initial_forced_theme !== null && this.GET_initial_forced_theme !== ''){
      this.themesService.initializeTheme(this.GET_initial_forced_theme);
    } else {
      // Initializate CSS theme:
      this.themesService.initializeTheme();
    }
  }

  onSubmit(form_data: NgForm): void {
    //Validate input fields:
    if(form_data.valid){
      //Signin:
      this.userAuth.userSignin(form_data);
    }
  }
}
