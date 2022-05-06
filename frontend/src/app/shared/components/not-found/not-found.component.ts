import { Component, OnInit } from '@angular/core';

//--------------------------------------------------------------------------------------------------------------------//
// IMPORTS:
//--------------------------------------------------------------------------------------------------------------------//
import { UsersAuthService } from '@auth/services/users-auth.service';                   // Users Auth Service
import { SharedPropertiesService } from '@shared/services/shared-properties.service';   // Shared Properties
//--------------------------------------------------------------------------------------------------------------------//

@Component({
  selector: 'app-not-found',
  templateUrl: './not-found.component.html',
  styleUrls: ['./not-found.component.css']
})
export class NotFoundComponent implements OnInit {

  //Inject services to the constructor:
  constructor(
    private userAuth: UsersAuthService,
    public sharedProp: SharedPropertiesService
  ) { }

  ngOnInit(): void {
    //Remove JWT and Auth Object:
    this.userAuth.removeToken();

    //Set false isLogged:
    this.sharedProp.isLoggedSetter(false);
  }
}
