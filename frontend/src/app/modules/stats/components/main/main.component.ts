import { Component, OnInit } from '@angular/core';

//--------------------------------------------------------------------------------------------------------------------//
// IMPORTS:
//--------------------------------------------------------------------------------------------------------------------//
import { SharedPropertiesService } from '@shared/services/shared-properties.service';   // Shared Properties
import { SharedFunctionsService } from '@shared/services/shared-functions.service';     // Shared Functions
import { StatsService } from '@modules/stats/services/stats.service';                       // Stats Serice
//--------------------------------------------------------------------------------------------------------------------//

@Component({
  selector: 'app-main',
  templateUrl: './main.component.html',
  styleUrls: ['./main.component.css']
})
export class MainComponent implements OnInit {
  //Inject services, components and router to the constructor:
  constructor(
    public sharedProp         : SharedPropertiesService,
    public sharedFunctions    : SharedFunctionsService,
    public statsService     : StatsService
  ) {
    //Get Logged User Information:
    this.sharedProp.userLogged = this.sharedFunctions.getUserInfo();

    //Set action properties:
    sharedProp.actionSetter({
      content_title : 'Estadística',
      content_icon  : 'query_stats',
      add_button    : false,
      filters_form  : false,
    });
  }

  ngOnInit(): void {
    //Find references:
    this.statsService.findReferences();
  }

}
