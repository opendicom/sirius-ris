import { Injectable } from '@angular/core';

//--------------------------------------------------------------------------------------------------------------------//
// IMPORTS:
//--------------------------------------------------------------------------------------------------------------------//
import { UsersAuthService } from '@auth/services/users-auth.service';   // Users Auth Service
//--------------------------------------------------------------------------------------------------------------------//

@Injectable({
  providedIn: 'root'
})
export class SharedPropertiesService {
  public isLogged: boolean = false;
  public action: any;

  //Inject services to the constructor:
  constructor(private userAuth: UsersAuthService) { }

  actionSetter(properties: any){
    this.action = properties;
  }

  checkIsLogged(){
    this.isLogged = this.userAuth.userIsLogged();
  }

  isLoggedSetter(isLogged: boolean){
    this.isLogged = isLogged;
  }
}
