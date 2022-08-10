import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ValidateDocumentsService {

  constructor() { }

  //--------------------------------------------------------------------------------------------------------------------//
  // VALIDATE:
  //--------------------------------------------------------------------------------------------------------------------//
  validate(doc_country_code: string, doc_type: string, document: string): any{
    //Simplify document type:
    const simplified_type = doc_country_code + '.' + doc_type;

    //Initialize result:
    let result = {
      registered_doc_type: false,
      validation_result: false
    };

    //Check document:
    if(document !== undefined && document !== ''){
      //Switch by documents types:
      switch(simplified_type){
        //Uruguay C.I. case:
        case '858.1':
          result = {
            registered_doc_type: true,
            validation_result: this.validate_858_1(document)
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

}
