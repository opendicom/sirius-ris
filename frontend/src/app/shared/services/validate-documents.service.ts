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
  // PARSE DOCUMENT (DOCUMENT PARSER):
  // Parse document using regex patterns and replacement rules defined in the main settings (.env file).
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

        //Argentina DNI case:
        case '032.1':
          result = {
            registered_doc_type: true,
            validation_result: this.validate_032_1(document),
            doc_parser: this.parseDocument(simplified_type, document)
          };

          break;

        //Brazil CPF case:
        case '076.1':
          result = {
            registered_doc_type: true,
            validation_result: this.validate_076_1(document),
            doc_parser: this.parseDocument(simplified_type, document)
          };

          break;

        //Venezuela C.I. case:
        case '862.1':
          result = {
            registered_doc_type: true,
            validation_result: this.validate_862_1(document),
            doc_parser: this.parseDocument(simplified_type, document)
          };

          break;

        //Colombia C.C. case:
        case '170.1':
          result = {
            registered_doc_type: true,
            validation_result: this.validate_170_1(document),
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
  // ARGENTINA DNI (032.1):
  //--------------------------------------------------------------------------------------------------------------------//
  validate_032_1(dni: string){
    //Normalize document:
    const normalized = (dni || '').replace(/\D/g, '');

    //Common DNI length is 7 or 8 digits.
    return /^[0-9]{7,8}$/.test(normalized);
  }
  //--------------------------------------------------------------------------------------------------------------------//


  //--------------------------------------------------------------------------------------------------------------------//
  // BRAZIL CPF (076.1):
  //--------------------------------------------------------------------------------------------------------------------//
  validate_076_1(cpf: string){
    //Normalize document:
    const normalized = (cpf || '').replace(/\D/g, '');

    //CPF is numeric and has 11 digits.
    if(!/^[0-9]{11}$/.test(normalized)){ return false; }

    //Reject known invalid repeated sequences.
    if(/^([0-9])\1{10}$/.test(normalized)){ return false; }

    //Calculate first and second verifier digits:
    const digits = normalized.split('').map((n) => parseInt(n, 10));

    //Calculate first verifier digit:
    let sum = 0;
    for(let i = 0; i < 9; i++){
      sum += digits[i] * (10 - i);
    }

    let firstVerifier = (sum * 10) % 11;
    if(firstVerifier === 10){ firstVerifier = 0; }
    if(firstVerifier !== digits[9]){ return false; }

    //Calculate second verifier digit:
    sum = 0;
    for(let i = 0; i < 10; i++){
      sum += digits[i] * (11 - i);
    }

    let secondVerifier = (sum * 10) % 11;
    if(secondVerifier === 10){ secondVerifier = 0; }

    //Return validation result:
    return secondVerifier === digits[10];
  }
  //--------------------------------------------------------------------------------------------------------------------//


  //--------------------------------------------------------------------------------------------------------------------//
  // VENEZUELA C.I. (862.1):
  //--------------------------------------------------------------------------------------------------------------------//
  validate_862_1(ci: string){
    //Normalize document:
    const normalized = (ci || '').replace(/\D/g, '');

    //Frequent C.I. range in practice.
    return /^[0-9]{6,8}$/.test(normalized);
  }
  //--------------------------------------------------------------------------------------------------------------------//


  //--------------------------------------------------------------------------------------------------------------------//
  // COLOMBIA C.C. (170.1):
  //--------------------------------------------------------------------------------------------------------------------//
  validate_170_1(cc: string){
    //Normalize document:
    const normalized = (cc || '').replace(/\D/g, '');

    //C.C. is numeric and commonly 6 to 10 digits.
    return /^[0-9]{6,10}$/.test(normalized);
  }
  //--------------------------------------------------------------------------------------------------------------------//  
}
