import { Injectable } from '@angular/core';

//--------------------------------------------------------------------------------------------------------------------//
// IMPORTS:
//--------------------------------------------------------------------------------------------------------------------//
import { FileSettingsService } from '@shared/services/file-settings.service';   // File Settings Service
//--------------------------------------------------------------------------------------------------------------------//

@Injectable()
export class AppInitializer {
  //Inject services to the constructor:
  constructor(private fileSettingsService: FileSettingsService) {}

  initializeApp(): () => Promise<void> {
    return () => this.fileSettingsService.loadFileSettings().toPromise();
  }
}
