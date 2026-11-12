import { Injectable } from '@angular/core';

//--------------------------------------------------------------------------------------------------------------------//
// IMPORTS:
//--------------------------------------------------------------------------------------------------------------------//
import { Observable, of } from 'rxjs';                                          // Reactive Extensions (RxJS)
import { map, catchError } from 'rxjs/operators';                               // Reactive Extensions (RxJS)
import { HttpErrorResponse } from '@angular/common/http';                       // HTTP Error Response
import { ApiClientService } from '@shared/services/api-client.service';         // API Client Service
import { FileSettingsService } from '@shared/services/file-settings.service';   // File Settings Service
//--------------------------------------------------------------------------------------------------------------------//

//--------------------------------------------------------------------------------------------------------------------//
// INTERFACES:
//--------------------------------------------------------------------------------------------------------------------//
export interface IdentityFindResult {
  found   : boolean;    // The document exists in identity-service.
  error   : boolean;    // The identity-service request failed (Not 404).
  person? : any;        // Normalized person data (Sirius RIS person fields).
}

export interface IdentityDifference {
  field     : string;   // Person field name (Form control name).
  sirius    : any;      // Value in Sirius RIS DB.
  identity  : any;      // Value in identity-service.
}
//--------------------------------------------------------------------------------------------------------------------//

@Injectable({
  providedIn: 'root'
})
export class IdentityService {
  //Person fields compared between Sirius RIS and identity-service (Form control names):
  public readonly comparedFields: string[] = ['name_01', 'name_02', 'surname_01', 'surname_02', 'gender', 'birth_date'];

  //Inject services to the constructor:
  constructor(
    private apiClient         : ApiClientService,
    private fileSettings      : FileSettingsService
  ) { }

  //--------------------------------------------------------------------------------------------------------------------//
  // GET SETTINGS:
  //--------------------------------------------------------------------------------------------------------------------//
  private get settings(): any {
    return this.fileSettings.mainSettings?.identityService || {};
  }
  //--------------------------------------------------------------------------------------------------------------------//


  //--------------------------------------------------------------------------------------------------------------------//
  // IS ENABLED:
  //--------------------------------------------------------------------------------------------------------------------//
  isEnabled(): boolean {
    return this.settings.enabled === true && !!this.settings.host;
  }
  //--------------------------------------------------------------------------------------------------------------------//


  //--------------------------------------------------------------------------------------------------------------------//
  // FIND:
  //--------------------------------------------------------------------------------------------------------------------//
  find(document: string): Observable<IdentityFindResult> {
    //Check service status and document:
    if(!this.isEnabled() || !document){
      return of({ found: false, error: false });
    }

    //Set headers:
    const headers = { 'X-API-Key': this.settings.apiKey || '' };

    //Set host:
    const host = this.settings.host.endsWith('/') ? this.settings.host : this.settings.host + '/';

    //Create observable find:
    const obsFind = this.apiClient.sendRequest('GET', 'find/' + encodeURIComponent(document), {}, headers, host);

    //Return normalized result:
    return obsFind.pipe(
      map((res: any): IdentityFindResult => {
        //Normalize person data:
        const person = this.normalizePerson(res);

        return person ? { found: true, error: false, person: person } : { found: false, error: false };
      }),

      catchError((err: HttpErrorResponse) => of({ found: false, error: err.status !== 404 }))
    );
  }
  //--------------------------------------------------------------------------------------------------------------------//


  //--------------------------------------------------------------------------------------------------------------------//
  // NORMALIZE PERSON:
  // Convert the identity-service response into Sirius RIS person fields.
  //--------------------------------------------------------------------------------------------------------------------//
  normalizePerson(res: any): any | null {
    //Check response:
    if(!res || res.success === false || !res.data || typeof res.data !== 'object'){ return null; }
    const raw = res.data;

    //Check that there is at least a name or a surname:
    if(!raw.primerNombre && !raw.primerApellido){ return null; }

    //Return person:
    return {
      name_01       : this.cleanText(raw.primerNombre),
      name_02       : this.cleanText(raw.segundoNombre),
      surname_01    : this.cleanText(raw.primerApellido),
      surname_02    : this.cleanText(raw.segundoApellido),
      gender        : this.parseGender(raw.sexo),
      birth_date    : this.parseDate(raw.fechaNacimiento),
      phone_numbers : []
    };
  }
  //--------------------------------------------------------------------------------------------------------------------//


  //--------------------------------------------------------------------------------------------------------------------//
  // PARSE GENDER (External service -> Sirius RIS gender: 1 = Male, 2 = Female, 3 = Other):
  //--------------------------------------------------------------------------------------------------------------------//
  private parseGender(value: any): string {
    switch(String(value ?? '').trim().toUpperCase()){
      case 'M': case 'MASCULINO': case 'HOMBRE': case 'VARON': case 'VARÓN': case 'MALE': case '1':
        return '1';
      case 'F': case 'FEMENINO': case 'MUJER': case 'FEMALE': case '2':
        return '2';
      default:
        return '';
    }
  }
  //--------------------------------------------------------------------------------------------------------------------//


  //--------------------------------------------------------------------------------------------------------------------//
  // IS SUPPORTED DOCUMENT:
  // identity-service only knows one type of document (Default: Uruguayan CI -> country 858, type 1).
  //--------------------------------------------------------------------------------------------------------------------//
  isSupportedDocument(doc_country_code: string, doc_type: string): boolean {
    const supported = this.settings.supportedDocument || { doc_country_code: '858', doc_type: '1' };
    return String(doc_country_code) === String(supported.doc_country_code) && String(doc_type) === String(supported.doc_type);
  }
  //--------------------------------------------------------------------------------------------------------------------//


  //--------------------------------------------------------------------------------------------------------------------//
  // COMPARE (Sirius RIS person vs identity-service person):
  //--------------------------------------------------------------------------------------------------------------------//
  compare(siriusPerson: any, identityPerson: any): IdentityDifference[] {
    //Initialize differences:
    const differences: IdentityDifference[] = [];

    //Get differences by field:
    this.comparedFields.forEach((field: string) => {
      const siriusValue = this.comparableValue(field, siriusPerson[field]);
      const identityValue = this.comparableValue(field, identityPerson[field]);

      if(identityValue !== '' && siriusValue !== identityValue){
        differences.push({ field: field, sirius: siriusPerson[field], identity: identityPerson[field] });
      }
    });

    //Return differences:
    return differences;
  }
  //--------------------------------------------------------------------------------------------------------------------//


  //--------------------------------------------------------------------------------------------------------------------//
  // COMPARABLE VALUE:
  //--------------------------------------------------------------------------------------------------------------------//
  private comparableValue(field: string, value: any): string {
    //Check empty values:
    if(value === undefined || value === null || value === ''){ return ''; }

    //Dates (Compare only the day):
    if(field === 'birth_date'){
      const date = this.parseDate(value);
      return date ? this.dateToString(date) : '';
    }

    //Texts (Case insensitive):
    return String(value).trim().normalize('NFD').replace(/[̀-ͯ]/g, '').toUpperCase();
  }
  //--------------------------------------------------------------------------------------------------------------------//


  //--------------------------------------------------------------------------------------------------------------------//
  // PARSE DATE:
  // Parse ISO dates (YYYY-MM-DD or YYYY-MM-DDTHH:mm...) and Date objects to local Date (Prevent one day off JS Date error).
  //--------------------------------------------------------------------------------------------------------------------//
  parseDate(value: any): Date | null {
    //Check empty value:
    if(value === undefined || value === null || value === ''){ return null; }

    //Date object:
    if(value instanceof Date){ return isNaN(value.getTime()) ? null : value; }

    //Replace '-' by '/' to prevent one day off JS Date error:
    const date = new Date(String(value).split('T')[0].replace(/-/g, '/'));

    //Return date:
    return isNaN(date.getTime()) ? null : date;
  }
  //--------------------------------------------------------------------------------------------------------------------//


  //--------------------------------------------------------------------------------------------------------------------//
  // DATE TO STRING (YYYY-MM-DD):
  //--------------------------------------------------------------------------------------------------------------------//
  dateToString(date: Date): string {
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return date.getFullYear() + '-' + month + '-' + day;
  }
  //--------------------------------------------------------------------------------------------------------------------//


  //--------------------------------------------------------------------------------------------------------------------//
  // CLEAN TEXT:
  //--------------------------------------------------------------------------------------------------------------------//
  private cleanText(value: any): string {
    return value === undefined || value === null ? '' : String(value).trim();
  }
  //--------------------------------------------------------------------------------------------------------------------//
}
