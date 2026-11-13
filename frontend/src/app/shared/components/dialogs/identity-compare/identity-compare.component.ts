import { Component, Inject, OnInit } from '@angular/core';

//--------------------------------------------------------------------------------------------------------------------//
// IMPORTS:
//--------------------------------------------------------------------------------------------------------------------//
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';                         // MatDialog Data and Reference
import { IdentityDifference, IdentityService } from '@shared/services/identity.service';          // Identity Service
import { I18nService } from '@shared/services/i18n.service';                                      // I18n Service
//--------------------------------------------------------------------------------------------------------------------//

@Component({
  selector: 'app-identity-compare',
  templateUrl: './identity-compare.component.html',
  styleUrls: ['./identity-compare.component.css']
})
export class IdentityCompareComponent implements OnInit {
  //Differences to resolve (data.differences) and user's choice by field:
  public differences  : IdentityDifference[] = [];
  public choices      : { [field: string]: string } = {};

  //Inject services to the constructor:
  constructor(
    @Inject(MAT_DIALOG_DATA) public data: any,  //Inject MAT_DIALOG_DATA to pass data:
    private dialogRef : MatDialogRef<IdentityCompareComponent>,
    private identity  : IdentityService,
    public  i18n      : I18nService
  ) { }

  ngOnInit(): void {
    this.differences = this.data.differences;

    //Sirius RIS data is preserved by default:
    this.differences.forEach((current: IdentityDifference) => { this.choices[current.field] = 'sirius'; });
  }

  //Display value by field:
  display(field: string, value: any): string {
    //Check empty value:
    if(value === undefined || value === null || value === ''){ return '-'; }

    switch(field){
      case 'gender':
        return this.i18n.instant('GENDER_TYPES.' + value);

      case 'birth_date':
        const date = this.identity.parseDate(value);
        return date ? date.toLocaleDateString() : '-';

      default:
        return String(value);
    }
  }

  //Select the same source for all the fields:
  selectAll(source: string): void {
    this.differences.forEach((current: IdentityDifference) => { this.choices[current.field] = source; });
  }

  //Close dialog returning only the fields where the user chose the identity-service value:
  onAccept(): void {
    const selected: { [field: string]: any } = {};

    this.differences.forEach((current: IdentityDifference) => {
      if(this.choices[current.field] === 'identity'){ selected[current.field] = current.identity; }
    });

    this.dialogRef.close(selected);
  }
}
