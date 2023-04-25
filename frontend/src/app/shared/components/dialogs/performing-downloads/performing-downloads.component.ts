import { Component, OnInit, Inject } from '@angular/core';

//--------------------------------------------------------------------------------------------------------------------//
// IMPORTS:
//--------------------------------------------------------------------------------------------------------------------//
import { MAT_DIALOG_DATA } from '@angular/material/dialog';                                       // MatDialog Data
import { SharedPropertiesService } from '@shared/services/shared-properties.service';             // Shared Properties
import { PdfService } from '@shared/services/pdf.service';                                        // PDF Service
import { FileManagerService } from '@shared/services/file-manager.service';                       // File manager service
import { ISO_3166, document_types, gender_types } from '@env/environment';                        // Enviroments
//--------------------------------------------------------------------------------------------------------------------//

@Component({
  selector: 'app-performing-downloads',
  templateUrl: './performing-downloads.component.html',
  styleUrls: ['./performing-downloads.component.css']
})
export class PerformingDownloadsComponent implements OnInit {
  //Set component properties:
  public country_codes          : any = ISO_3166;
  public document_types         : any = document_types;
  public gender_types           : any = gender_types;

  //Inject services to the constructor:
  constructor(
    @Inject(MAT_DIALOG_DATA)
    public data         : any,        //Inject MAT_DIALOG_DATA to pass data
    public sharedProp   : SharedPropertiesService,
    public pdfService   : PdfService,
    public fileManager  : FileManagerService
  ) { }

  ngOnInit(): void {
  }

}
