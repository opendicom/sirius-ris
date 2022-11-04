import { Pipe, PipeTransform } from '@angular/core';

//--------------------------------------------------------------------------------------------------------------------//
// IMPORTS:
//--------------------------------------------------------------------------------------------------------------------//
import { SharedFunctionsService } from '@shared/services/shared-functions.service';               // Shared Functions
//--------------------------------------------------------------------------------------------------------------------//

@Pipe({
  name: 'accno_date'
})
export class AccnoDatePipe implements PipeTransform {

  //Inject Shared Functions Service:
  constructor(private sharedFunctions: SharedFunctionsService){}

  transform(value: any): any {
    //Format accession number date:
    const formatted_date = this.sharedFunctions.accessionDateFormat(value);

    //Return formated date:
    return formatted_date.day + '/' + formatted_date.month + '/' + formatted_date.year + ' ' + formatted_date.hour + ':' + formatted_date.minute + ':' + formatted_date.second;
  }

}
