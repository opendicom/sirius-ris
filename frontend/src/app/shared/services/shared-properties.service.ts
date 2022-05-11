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
  public isLogged : boolean = false;
  public action   : any;
  public element  : any;
  public params   : any;

  //Request params:
  public regex        : string;
  public filter       : string;
  public filterFields : any;
  public projection   : any;
  public sort         : any;
  public pager        : any;

  //Action fields:
  public status: string;

  //Inject services to the constructor:
  constructor(private userAuth: UsersAuthService) {
    //Initialize filter (empty):
    this.filter = '';
    this.status = '';
    this.regex = '';
  }

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
  //--------------------------------------------------------------------------------------------------------------------//


  //--------------------------------------------------------------------------------------------------------------------//
  // PARAMS REFRESH:
  //--------------------------------------------------------------------------------------------------------------------//
  paramsRefresh(): void {
    let string_regex  : string = '';
    let string_filter : string = '';
    let string_proj   : string = '';
    let string_sort   : string = '';
    let string_pager  : string = '';

    //Adjust params formats:
    //Regex:
    if(this.regex != ''){
      string_regex = '"regex": "' + this.regex + '", ';
    }

    //Check Word Search - Filter (With OR Condition):
    if(this.filter != ''){
      for(let key in this.filterFields){
        string_filter += '"filter[or][' + this.filterFields[key] + ']": "' + this.filter + '", ';
      }
    }

    //Check status - Filter (With AND Condition)::
    if(this.status === 'true' || this.status === 'false'){
      string_filter += '"filter[and][status]": "' + this.status + '", ';
    }

    //Projection:
    for(let key in this.projection){
      string_proj += '"proj[' + key + ']": "' + this.projection[key] + '", ';
    }

    //Sort:
    for(let key in this.sort){
      string_sort += '"sort[' + key + ']": "' + this.sort[key] + '", ';
    }

    //Pager:
    string_pager = '"pager[page_number]": "' + this.pager['page_number'] + '", ';
    string_pager += '"pager[page_limit]": "' + this.pager['page_limit'] + '"';

    //Concat string params:
    const string_params = '{ ' + string_regex + string_filter + string_proj + string_sort + string_pager + ' }';

    //Set params:
    this.params = JSON.parse(string_params);
  }
  //--------------------------------------------------------------------------------------------------------------------//
}
