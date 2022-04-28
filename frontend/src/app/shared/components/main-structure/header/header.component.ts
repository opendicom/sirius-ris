import { Component, OnInit } from '@angular/core';

//--------------------------------------------------------------------------------------------------------------------//
// IMPORTS:
//--------------------------------------------------------------------------------------------------------------------//
import { SharedFunctionsService } from '@shared/services/shared-functions.service';   // Shared Functions
//--------------------------------------------------------------------------------------------------------------------//

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css']
})
export class HeaderComponent implements OnInit {
  public user_info: any;

  //Inject services to the constructor:
  constructor(private sharedFunctions: SharedFunctionsService) { }

  ngOnInit(): void {
    //Get User Logged Information:
    //this.user_info = this.sharedFunctions.getUserInfo();
    this.user_info.name_01 = "NOMBRE";
    this.user_info.name_01 = "APELLIDO";
  }

}
