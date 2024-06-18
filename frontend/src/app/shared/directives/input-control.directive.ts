import { Directive, HostListener } from '@angular/core';

//--------------------------------------------------------------------------------------------------------------------//
// NUMBERS:
//--------------------------------------------------------------------------------------------------------------------//
@Directive({
  selector: '[icNumbers]',
})
export class numbersDirective {
  @HostListener('keydown', ['$event'])
  onKeyDown(event: any) {
    return inputControl(event, 'numbers');
  }
}
//--------------------------------------------------------------------------------------------------------------------//


//--------------------------------------------------------------------------------------------------------------------//
// NUMBERS WITH SPACES:
//--------------------------------------------------------------------------------------------------------------------//
@Directive({
  selector: '[icNumbersWS]',
})
export class numbersWSDirective {
  @HostListener('keydown', ['$event'])
  onKeyDown(event: any) {
    return inputControl(event, 'numbers', true);
  }
}
//--------------------------------------------------------------------------------------------------------------------//


//--------------------------------------------------------------------------------------------------------------------//
// NUMBERS WITH DOTS:
//--------------------------------------------------------------------------------------------------------------------//
@Directive({
  selector: '[icNumbersWD]',
})
export class numbersWDDirective {
  @HostListener('keydown', ['$event'])
  onKeyDown(event: any) {
    return inputControl(event, 'numbers', false, true);
  }
}
//--------------------------------------------------------------------------------------------------------------------//


//--------------------------------------------------------------------------------------------------------------------//
// LETTERS:
//--------------------------------------------------------------------------------------------------------------------//
@Directive({
  selector: '[icLetters]',
})
export class lettersDirective {
  @HostListener('keydown', ['$event'])
  onKeyDown(event: any) {
    return inputControl(event, 'letters');
  }
}
//--------------------------------------------------------------------------------------------------------------------//


//--------------------------------------------------------------------------------------------------------------------//
// LETTERS WITH SPACES:
//--------------------------------------------------------------------------------------------------------------------//
@Directive({
  selector: '[icLettersWS]',
})
export class lettersWSDirective {
  @HostListener('keydown', ['$event'])
  onKeyDown(event: any) {
    return inputControl(event, 'letters', true);
  }
}
//--------------------------------------------------------------------------------------------------------------------//


//--------------------------------------------------------------------------------------------------------------------//
// SPECIAL CHARS:
//--------------------------------------------------------------------------------------------------------------------//
@Directive({
  selector: '[icSpecialChars]',
})
export class specialCharsDirective {
  @HostListener('keydown', ['$event'])
  onKeyDown(event: any) {
    return inputControl(event, 'specialchars');
  }
}
//--------------------------------------------------------------------------------------------------------------------//


//--------------------------------------------------------------------------------------------------------------------//
// SPECIAL CHARS WITH SPACES:
//--------------------------------------------------------------------------------------------------------------------//
@Directive({
  selector: '[icSpecialCharsWS]',
})
export class specialCharsWSDirective {
  @HostListener('keydown', ['$event'])
  onKeyDown(event: any) {
    return inputControl(event, 'specialchars', true);
  }
}
//--------------------------------------------------------------------------------------------------------------------//


//--------------------------------------------------------------------------------------------------------------------//
// ARRAY RANGE:
//--------------------------------------------------------------------------------------------------------------------//
function arrayRange(start: number, end: number) {
  if(end >= start){
    let range = new Array();
    for(let i = start; i <= end; i++){
      range.push(i);
    }
    return range;
  } else {
    return new Array();
  }
}
//--------------------------------------------------------------------------------------------------------------------//


//--------------------------------------------------------------------------------------------------------------------//
// INPUT CONTROL:
//--------------------------------------------------------------------------------------------------------------------//
function inputControl(event: any, validationType: string, allowSpaces: boolean = false, allowDots: boolean = false) {
  //Get char code:
  const charCode = (event.which) ? event.which : event.keyCode;

  //Initializate allowed chars:
  let allowedChars = [];

  //Define allowed characters:
  switch (validationType) {
    case 'numbers':
      //Ascii codes for [0-9] and [Numpad0-Numpad9]:
      allowedChars = arrayRange(48, 57).concat( arrayRange(96, 105) );
      break;
    case 'letters':
      //Ascii codes for [A-Z], [a-z]:
      allowedChars = arrayRange(65, 90).concat( arrayRange(97, 122) );
      break;
    case 'specialchars':
      //Ascii codes for [A-Z], [a-z]:
      allowedChars = arrayRange(65, 90).concat( arrayRange(97, 122) );

      //Add some special chars:
      allowedChars.push(39, 59, 193, 201, 205, 209, 211, 218, 225, 233, 237, 241, 243, 250);
      break;
  }
  
  //Allow Spaces:
  if(allowSpaces){
    allowedChars.push(32);
  }
  
  //Allow Dots:
  if(allowDots){
    allowedChars.push(190);
    allowedChars.push(110); //NumpadDecimal
  }

  //Allow backspace, tab, enter, arrow keys:
  allowedChars.push(8, 9, 13, 37, 39);

  //Return allowed chars:
  return (allowedChars.indexOf(charCode) >= 0);
}
//--------------------------------------------------------------------------------------------------------------------//