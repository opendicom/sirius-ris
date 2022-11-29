import { Injectable } from '@angular/core';

//--------------------------------------------------------------------------------------------------------------------//
// IMPORTS:
//--------------------------------------------------------------------------------------------------------------------//
import { SharedFunctionsService } from '@shared/services/shared-functions.service';     // Shared Functions
import { regexObjectId } from '@env/environment';                                       // Enviroments
import * as pdfMake from "pdfmake/build/pdfmake";
import * as pdfFonts from 'pdfmake/build/vfs_fonts';
(<any>pdfMake).vfs = pdfFonts.pdfMake.vfs;
//--------------------------------------------------------------------------------------------------------------------//

@Injectable({
  providedIn: 'root'
})
export class PdfService {

  constructor() { }

  createPDF(type: string, _id: string, friendly_pass: string | undefined = undefined){
    //Initialize document:
    let docDefinition : any;

    //Check if friendly pass is accessible:
    if(friendly_pass === undefined){
      friendly_pass = 'La contraseña ya no es accesible.';
    }

    //Set PDF document by type:
    switch(type){
      // PDF APPOINTMENT:
      case 'appointment':

        //Define document structure:
        docDefinition = {
          content: [
            // TÍTULO:
            { text: 'COMPROBANTE DE CITA', style: 'header'},

            // DATOS DE REALIZACIÓN:
            {
              style: 'main_table',
              table: {
                widths: ['*', '*', '*', '*'],
                body: [
                  [{ text: 'REALIZACIÓN', colSpan: 4, style: 'header_table' }, {}, {}, {}],
                  [{ text: 'Organización', style: 'label_table' }, 'CUDIM', { text: 'Fecha de cita', style: 'label_table' }, '23/11/2022'],
                  [{ text: 'Sucursal', style: 'label_table' }, 'Ricaldoni', { text: 'Horario de cita', style: 'label_table' }, '09:30 a 10:00 hs'],
                  [{ text: 'Servicio', style: 'label_table' }, 'PET-CT', { text: 'Procedimiento', style: 'label_table' }, 'WHB FDG']
                ]
              }
            },

            // DATOS DEL PACIENTE:
            {
              style: 'main_table',
              table: {
                widths: ['*', '*'],
                body: [
                  [{ text: 'PACIENTE', colSpan: 2, style: 'header_table' }, {}],
                  [{ text: 'Documento', style: 'label_table' }, '52763658'],
                  [{ text: 'Nombre/s', style: 'label_table' }, 'CAMILO'],
                  [{ text: 'Apellido/s', style: 'label_table' }, 'PIFANO HERRERA'],
                  [{ text: 'Contraseña de acceso', style: 'label_table' }, friendly_pass]
                ]
              }
            },

            // PREPARACIÓN:
            {
              style: 'main_table',
              table: {
                widths: ['*'],
                body: [
                  [{ text: 'PREPARACIÓN PREVIA', style: 'header_table' }],
                  ['El paciente debe presentarse con 24 hs de ayuno, no puede realizar esfruezos físicos 24 hs previas al estudio.']
                ]
              }
            }
          ],

          //STYLES:
          styles: {
            header: {
              margin: [0, 0, 0, 10],
              fontSize: 18,
              bold: true,
              alignment: 'center'
            },
            main_table: {
              margin: [0, 5, 0, 15],
              fontSize: 11
            },
            header_table: {
              fillColor: '#D3D4D8',
              alignment: 'center',
              bold: true
            },
            label_table: {
              fillColor: '#E9E9EB'
            }
          }
        };
        break;

      // PDF STUDY:
      case 'study':
        break;

      // PDF REPORT:
      case 'report':
        break;
    }

    //Create PDF and open in browser:
    pdfMake.createPdf(docDefinition).open();
  }
}
