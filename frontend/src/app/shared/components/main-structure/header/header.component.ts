import { Component, OnInit } from '@angular/core';

//--------------------------------------------------------------------------------------------------------------------//
// IMPORTS:
//--------------------------------------------------------------------------------------------------------------------//
import { SharedFunctionsService } from '@shared/services/shared-functions.service';   // Shared Functions
import { user_roles } from '@env/environment';                                        // Enviroment
//--------------------------------------------------------------------------------------------------------------------//

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css']
})
export class HeaderComponent implements OnInit {
  public user_info: any;
  public userRoles: any = user_roles;

  //Inject services to the constructor:
  constructor(private sharedFunctions: SharedFunctionsService) { }

  ngOnInit(): void {
    //Get User Logged Information:
    this.user_info = this.sharedFunctions.getUserInfo();
  }

}
