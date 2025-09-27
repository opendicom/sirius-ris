import { Injectable } from '@angular/core';

//--------------------------------------------------------------------------------------------------------------------//
// IMPORTS:
//--------------------------------------------------------------------------------------------------------------------//
import { SharedPropertiesService } from '@shared/services/shared-properties.service';   // Shared Properties
import { SharedFunctionsService } from '@shared/services/shared-functions.service';     // Shared Functions
import { FileSettingsService } from '@shared/services/file-settings.service';           // File Settings Service
import { I18nService } from '@shared/services/i18n.service';                           // I18n Service
//--------------------------------------------------------------------------------------------------------------------//

@Injectable()
export class AppInitializer {
  //Inject services to the constructor:
  constructor(
    public sharedProp       : SharedPropertiesService,
    public sharedFunctions  : SharedFunctionsService,
    public fileSettings     : FileSettingsService,
    public i18nService      : I18nService
  ) {}

  initializeApp(): () => Promise<void> {
    //Create observable:
    const obsFileSettings = this.fileSettings.loadFileSettings();

    //Load file settings from JSON main.settings file:
    obsFileSettings.subscribe((fileData) => {
      //Set file configuration on duplicate properties (More important services to prevent Circular Dependencies):
      this.sharedFunctions.mainSettings = fileData;
      this.sharedProp.mainSettings = fileData;
      this.fileSettings.mainSettings = fileData;
      
      //Initialize i18n service with the language from configuration:
      this.i18nService.initializeLanguage();
    });

    //Return promise:
    return () => obsFileSettings.toPromise();
  }
}
