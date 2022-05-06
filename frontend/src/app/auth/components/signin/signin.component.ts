import { Component, OnInit } from '@angular/core';

//--------------------------------------------------------------------------------------------------------------------//
// IMPORTS:
//--------------------------------------------------------------------------------------------------------------------//
import { NgForm } from '@angular/forms';                                                // NgForm (bidirectional binding)
import { UsersAuthService } from '@auth/services/users-auth.service';                   // Users Auth Service
import { app_setting, document_types, ISO_3166 } from '@env/environment';               // Enviroment
import { SharedPropertiesService } from '@shared/services/shared-properties.service';   // Shared Properties
import { SharedFunctionsService } from '@shared/services/shared-functions.service';     // Shared Functions
//--------------------------------------------------------------------------------------------------------------------//

@Component({
  selector: 'app-signin',
  templateUrl: './signin.component.html',
  styleUrls: ['./signin.component.css']
})
export class SigninComponent implements OnInit {
  public settings: any = app_setting;
  public country_codes: any = ISO_3166;
  public document_types: any = document_types;

  //Re-define method in component to use in HTML view:
  public getKeys: any;

  //Inject services to the constructor:
  constructor(
    private userAuth: UsersAuthService,
    public sharedProp: SharedPropertiesService,
    private sharedFunctions: SharedFunctionsService
  ) {
    //Pass Service Method:
    this.getKeys = this.sharedFunctions.getKeys;
  }

  ngOnInit(): void {
    //Logout if is entered in this component:
    this.userAuth.userLogout();

    //Refresh isLoged value not display the toolbar and sidebar:
    this.sharedProp.checkIsLogged();
  }

  onSubmit(form_data: NgForm): void {
    //Validate input fields:
    if(form_data.valid){
      //Signin:
      this.userAuth.userSignin(form_data);
    }
  }
}
