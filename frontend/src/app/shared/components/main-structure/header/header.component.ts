import { Component, OnInit } from '@angular/core';

//--------------------------------------------------------------------------------------------------------------------//
// IMPORTS:
//--------------------------------------------------------------------------------------------------------------------//
import { SharedPropertiesService } from '@shared/services/shared-properties.service';   // Shared Properties
import { SharedFunctionsService } from '@shared/services/shared-functions.service';     // Shared Functions
import { ThemesService } from '@shared/services/themes.service';                        // Themes Service
import { objectKeys } from '@env/environment';                                          // Enviroments
//--------------------------------------------------------------------------------------------------------------------//

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css']
})
export class HeaderComponent implements OnInit {
  public userRolesKeys: string[] = objectKeys.userRolesKeys;

  //Inject services to the constructor:
  constructor(
    public sharedProp       : SharedPropertiesService,
    public sharedFunctions  : SharedFunctionsService,
    public themesService    : ThemesService
  ) { }

  ngOnInit(): void { }

}
