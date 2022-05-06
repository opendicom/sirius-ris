import { Injectable } from '@angular/core';

//--------------------------------------------------------------------------------------------------------------------//
// IMPORTS:
//--------------------------------------------------------------------------------------------------------------------//
import { Router, CanActivate } from '@angular/router';                                  // Router and Guard CanActivate
import { UsersAuthService } from '@auth/services/users-auth.service';                   // Users Auth Service
import { SharedPropertiesService } from '@shared/services/shared-properties.service';   // Shared Properties
//--------------------------------------------------------------------------------------------------------------------//

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {

  //Inject services to the constructor:
  constructor(
    private userAuth: UsersAuthService,
    private router: Router,
    public sharedProp: SharedPropertiesService,
  ) { }

  canActivate(){
    //Check authentication:
    if (!this.userAuth.userIsLogged()) {
      this.router.navigate(['/signin']);
      return false;
    }

    //Refresh isLoged value for display or not the toolbar and sidebar:
    this.sharedProp.checkIsLogged();

    //In case the authentication is correct, let pass (continue):
    return true;
  }

}
