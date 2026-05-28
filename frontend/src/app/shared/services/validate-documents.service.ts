import { Injectable } from '@angular/core';

//--------------------------------------------------------------------------------------------------------------------//
// IMPORTS:
//--------------------------------------------------------------------------------------------------------------------//
import { SharedPropertiesService } from '@shared/services/shared-properties.service';   // Shared Properties
//--------------------------------------------------------------------------------------------------------------------//

@Injectable({
  providedIn: 'root'
})
export class ValidateDocumentsService {
  //Get documents parsers from main settings:
  public docParser: any = this.sharedProp.mainSettings.documentsParsers || {};

  //Inject services to the constructor:
  constructor(
    public sharedProp: SharedPropertiesService
  ){ }

  //--------------------------------------------------------------------------------------------------------------------//
  // VALIDATE:
  //--------------------------------------------------------------------------------------------------------------------//
  validate(doc_country_code: string, doc_type: string, document: string): any{
    //Simplify document type:
    const simplified_type = doc_country_code + '.' + doc_type;

    //Initialize result:
    let result = {
      registered_doc_type: false,
      validation_result: false,
      doc_parser: {
        is_parsed: false,
        parser_result: document
      }
    };

    //Check document:
    if(document !== undefined && document !== ''){
      //Switch by documents types:
      switch(simplified_type){
        //Uruguay C.I. case:
        case '858.1':
          result = {
            registered_doc_type: true,
            validation_result: this.validate_858_1(document),
            doc_parser: this.parseDocument(simplified_type, document)
          };

          break;
      }
    }

    //Return result:
    return result;
  }
  //--------------------------------------------------------------------------------------------------------------------//


  //--------------------------------------------------------------------------------------------------------------------//
  // URUGUAY C.I. (858.1):
  // Based in: https://github.com/picandocodigo/ci_js
  //--------------------------------------------------------------------------------------------------------------------//
  validate_858_1(ci: any){
    //Initializate CI is valid:
    let result = false;

    //Check min document length:
    if(ci.length >= 7){
      ci = ci.replace(/\D/g, '');
      let dig = ci[ci.length - 1];
      ci = ci.replace(/[0-9]$/, '');
      result = (dig == this.validation_digit_858_1(ci));
    }

    //Return result:
    return result;
  }

  validation_digit_858_1(ci: string){
    let a = 0;
    let i = 0;

    if(ci.length <= 6){
      for(i = ci.length; i < 7; i++){
        ci = '0' + ci;
      }
    }

    for(i = 0; i < 7; i++){
      a += (parseInt("2987634"[i]) * parseInt(ci[i])) % 10;
    }

    if(a%10 === 0){
      return 0;
    } else {
      return 10 - a % 10;
    }
  }
  //--------------------------------------------------------------------------------------------------------------------//


  //--------------------------------------------------------------------------------------------------------------------//
  // PARSE DOCUMENT (DOCUMENT PARSER):
  //--------------------------------------------------------------------------------------------------------------------//
  parseDocument(simplified_type: string, document: string): any{
    //Initialize result:
    let result = {
      is_parsed: false,
      parser_result: document
    };

    //Check document:
    if (document !== undefined && document !== '') {

      //Check if parser exists:
      if(this.docParser[simplified_type] !== undefined){
        //Create regex dynamically:
        const regex = new RegExp(this.docParser[simplified_type].pattern, this.docParser[simplified_type].flags);

        //Parse document:
        result = {
          is_parsed: true,
          parser_result: document.replace(regex, this.docParser[simplified_type].replace)
        };
      }
    }

    //Return result:
    return result;
  }
  //--------------------------------------------------------------------------------------------------------------------//  
}
