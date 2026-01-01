import { Component, OnInit } from '@angular/core';

//--------------------------------------------------------------------------------------------------------------------//
// IMPORTS:
//--------------------------------------------------------------------------------------------------------------------//
import { SharedPropertiesService } from '@shared/services/shared-properties.service';   // Shared Properties
import { SharedFunctionsService } from '@shared/services/shared-functions.service';     // Shared Functions
import { ThemesService } from '@shared/services/themes.service';                        // Themes Service
//--------------------------------------------------------------------------------------------------------------------//

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css']
})
export class HeaderComponent implements OnInit {
  public userRolesKeys: string[] = ['1','2','3','4','5','6','7','8','9','10'];

  //Inject services to the constructor:
  constructor(
    public sharedProp       : SharedPropertiesService,
    public sharedFunctions  : SharedFunctionsService,
    public themesService    : ThemesService
  ) { }

  ngOnInit(): void { }

}
