import { Component, OnInit } from '@angular/core';

//--------------------------------------------------------------------------------------------------------------------//
// IMPORTS:
//--------------------------------------------------------------------------------------------------------------------//
import { SharedPropertiesService } from '@shared/services/shared-properties.service';     // Shared Properties
import { SharedFunctionsService } from '@shared/services/shared-functions.service';       // Shared Functions
//--------------------------------------------------------------------------------------------------------------------//

@Component({
  selector: 'app-sidenav',
  templateUrl: './sidenav.component.html',
  styleUrls: ['./sidenav.component.css']
})
export class SidenavComponent implements OnInit {

  //Inject services to the constructor:
  constructor(
    public sharedProp       : SharedPropertiesService,
    public sharedFunctions  : SharedFunctionsService
  ) { }

  ngOnInit(): void {
  }
}
