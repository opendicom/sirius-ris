import { Injectable } from '@angular/core';

//--------------------------------------------------------------------------------------------------------------------//
// IMPORTS:
//--------------------------------------------------------------------------------------------------------------------//
import { SharedPropertiesService } from '@shared/services/shared-properties.service';   // Shared Properties
import { SharedFunctionsService } from '@shared/services/shared-functions.service';     // Shared Functions
import { FileSettingsService } from '@shared/services/file-settings.service';           // File Settings Service
import { I18nService } from '@shared/services/i18n.service';                            // I18n service
import { mergeMap } from 'rxjs/operators';                                              // Reactive Extensions (RxJS)
//--------------------------------------------------------------------------------------------------------------------//

@Injectable()
export class AppInitializer {
  //Inject services to the constructor:
  constructor(
    public sharedProp       : SharedPropertiesService,
    public sharedFunctions  : SharedFunctionsService,
    public fileSettings     : FileSettingsService,
    public i18n             : I18nService
  ) {}

  initializeApp(): () => Promise<void> {
    // Create observable:
    const obsFileSettings = this.fileSettings.loadFileSettings();

    // Create observable pipeline:
    // Load settings then translations for defined lang.
    const obsInit = obsFileSettings.pipe(
      mergeMap((fileData) => {
        //Set file configuration on duplicate properties (to prevent circular deps):
        this.sharedFunctions.mainSettings = fileData;
        this.sharedProp.mainSettings = fileData;
        this.fileSettings.mainSettings = fileData;

        // Read language from main-settings (fallback to 'en') and load translations:
        // Normalize language code: accept values like 'ES', 'es-AR', 'en' and map to 'es'|'en' (filename format).
        const rawLang = fileData && fileData.appSettings && fileData.appSettings.language ? String(fileData.appSettings.language).toLowerCase() : 'en';
        const lang = rawLang.split(/[-_]/)[0];
        return this.i18n.loadTranslations(lang);
      })
    );

    // Return promise so APP_INITIALIZER waits for both settings and translations to finish:
    return () => obsInit.toPromise() as Promise<void>;
  }
}
