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
  actionSetter(properties: any): void {
    this.action = properties;
  }

  checkIsLogged(): void {
    this.isLogged = this.userAuth.userIsLogged();
  }

  isLoggedSetter(isLogged: boolean): void {
    this.isLogged = isLogged;
  }

  elementSetter(element: string): void {
    this.element = element;
  }

  paramsSetter(filterFields: any, proj: any, sort: any, pager: any): void {
    let string_filter: string = '';
    let string_proj: string = '';
    let string_sort: string = '';
    let string_pager: string = '';

    //DEBUG (Get action filter value):
    let filter = '';

    //Adjust params formats:
    //Filter:
    if(filter != ''){
      //Filter:
      for(let key in filterFields){
        string_filter += '"filter[' + filterFields[key] + ']": "' + filter + '", ';
      }
    }

    //Projection:
    for(let key in proj){
      string_proj += '"proj[' + key + ']": "' + proj[key] + '", ';
    }

    //Sort:
    for(let key in sort){
      string_sort += '"sort[' + key + ']": "' + sort[key] + '", ';
    }

    //Pager:
    string_pager = '"pager[page_number]": "' + pager['page_number'] + '", ';
    string_pager += '"pager[page_limit]": "' + pager['page_limit'] + '"';

    //Concat string params:
    const string_params = '{ ' + string_filter + string_proj + string_sort + string_pager + ' }';

    //Set params:
    this.params = JSON.parse(string_params);
  }
  //--------------------------------------------------------------------------------------------------------------------//
}
