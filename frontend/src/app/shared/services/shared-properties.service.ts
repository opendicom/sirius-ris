import { Injectable } from '@angular/core';

//--------------------------------------------------------------------------------------------------------------------//
// IMPORTS:
//--------------------------------------------------------------------------------------------------------------------//
import { UsersAuthService } from '@auth/services/users-auth.service';         // Users Auth Service
//--------------------------------------------------------------------------------------------------------------------//

@Injectable({
  providedIn: 'root'
})
export class SharedPropertiesService {
  public isLogged: boolean = false;
  public action: any;
  public element: any;
  public params: any;

  //Inject services to the constructor:
  constructor(private userAuth: UsersAuthService) { }

  //--------------------------------------------------------------------------------------------------------------------//
  // SHARED PROPERTIES SETTERS:
  //--------------------------------------------------------------------------------------------------------------------//
  actionSetter(properties: any){
    this.action = properties;
  }

  checkIsLogged(){
    this.isLogged = this.userAuth.userIsLogged();
  }

  isLoggedSetter(isLogged: boolean){
    this.isLogged = isLogged;
  }

  elementSetter(element: string){
    this.element = element;
  }

  paramsSetter(params: any){
    this.params = params;
  }
  //--------------------------------------------------------------------------------------------------------------------//
}
