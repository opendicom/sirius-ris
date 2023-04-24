import { Component, OnInit } from '@angular/core';

//--------------------------------------------------------------------------------------------------------------------//
// IMPORTS:
//--------------------------------------------------------------------------------------------------------------------//
import { SharedFunctionsService } from '@shared/services/shared-functions.service';     // Shared Functions
//--------------------------------------------------------------------------------------------------------------------//

@Component({
  selector: 'app-password-request',
  templateUrl: './password-request.component.html',
  styleUrls: ['./password-request.component.css']
})
export class PasswordRequestComponent implements OnInit {

  //Inject services to the constructor:
  constructor(
    public sharedFunctions: SharedFunctionsService
  ){ }

  ngOnInit(): void {
    //Clear previous password:
    this.sharedFunctions.requested_password = '';
  }

}
