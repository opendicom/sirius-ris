import { Pipe, PipeTransform } from '@angular/core';

//--------------------------------------------------------------------------------------------------------------------//
// IMPORTS:
//--------------------------------------------------------------------------------------------------------------------//
import { SharedFunctionsService } from '@shared/services/shared-functions.service';               // Shared Functions
//--------------------------------------------------------------------------------------------------------------------//

@Pipe({
  name: 'visibleLength'
})
export class VisibleLengthPipe implements PipeTransform {

  constructor(private sharedFunctions: SharedFunctionsService){}

  transform(value: any): number {
    return this.sharedFunctions.getVisibleLength(value);
  }

}