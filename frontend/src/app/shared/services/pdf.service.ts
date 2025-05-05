import { Injectable } from '@angular/core';

//--------------------------------------------------------------------------------------------------------------------//
// IMPORTS:
//--------------------------------------------------------------------------------------------------------------------//
import { ApiClientService } from '@shared/services/api-client.service';                 // API Client Service
import { SharedFunctionsService } from '@shared/services/shared-functions.service';     // Shared Functions
import { map } from 'rxjs/operators';                                                   // Reactive Extensions (RxJS)
import { regexObjectId } from '@env/environment';                                       // Enviroments

//PDF Make:
// Note: Use ts-ignore comment to suppress PDFMake declarations errors.
// @ts-ignore
import * as pdfMake from 'pdfmake/build/pdfmake';
// @ts-ignore
import * as pdfFonts from 'pdfmake/build/vfs_fonts';
(pdfMake as any).vfs = pdfFonts.vfs;

//HTML to PDF Make:
import htmlToPdfmake from 'html-to-pdfmake';
//--------------------------------------------------------------------------------------------------------------------//

@Injectable({
  providedIn: 'root'
})
export class PdfService {
  //Initializate logo content and style:
  public logoEmailContent : any = '';
  public logoPDFContent   : any = '';
  public logoPDFStyle     : any = {};

  //Initializate logo controllers:
  public organizationLogo : null | string = null;
  public branchLogo : null | string = null;

  //Set Base64 Regex to validate:
  private regexBase64 = /^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=|[A-Za-z0-9+/]{4})$/;
  
  //Inject services to the constructor:
  constructor(
    public sharedFunctions  : SharedFunctionsService,
    private apiClient       : ApiClientService,
  ) { }

  createPDF(type: string, _id: string, friendly_pass: string | undefined = undefined, send_mail: boolean = false, open_document: boolean = true, email_destination: string | undefined = undefined){
    //Initialize document & pdfDocument:
    let docDefinition : any;
    let pdfDocument : any;

    //Check if friendly pass is accessible:
    if(friendly_pass === undefined){
      friendly_pass = 'La contraseña ya no es accesible.';
    }

    //Check _id:
    if(_id !== undefined && regexObjectId.test(_id)){

      //Set PDF document by type:
      switch(type){
        // PDF APPOINTMENT:
        case 'appointment':
          //Initializate patient complete name, appointment datetime and appointment preparation:
          let patient_complete_name: any = undefined;
          let datetime: any = undefined;
          let appointment_preparation: string = '<p>El procedimiento a realizar <strong>NO posee preparación previa.</strong><p>';

          //Set params:
          const appointmentsParams = {
            'filter[_id]': _id,
            
            //Custom projection to obtain base64_logo:
            'proj[patient]' : 1,
            'proj[start]' : 1,
            'proj[end]' : 1,
            'proj[procedure.preparation]' : 1,
            'proj[procedure.name]' : 1,
            'proj[imaging.organization.short_name]' : 1,
            'proj[imaging.organization.name]' : 1,
            'proj[imaging.branch.short_name]' : 1,
            'proj[imaging.branch.appointment_footer]' : 1,
            'proj[imaging.service.name]' : 1,
            'proj[imaging.organization.base64_logo]' : 1,
            'proj[imaging.branch.base64_logo]' : 1
          };

          //Find appointment by _id:
          //Use Api Client to prevent reload current list response [sharedFunctions.find -> this.response = res].
          const obsAppointment = this.apiClient.sendRequest('GET', 'appointments/find', appointmentsParams).pipe(
            map((res: any) => {
              //Check operation status:
              if(res.success === true){
                //Set logos:
                this.setLogos(res.data[0].imaging);

                //Get complete name:
                patient_complete_name = this.getCompleteName(res.data[0].patient.person);

                //Start and End datetime:
                datetime = this.sharedFunctions.datetimeFulCalendarFormater(new Date(res.data[0].start), new Date(res.data[0].end));

                //Check appointment footer:
                let appointment_footer: any = '';
                if(res.data[0].imaging.branch.appointment_footer !== undefined && res.data[0].imaging.branch.appointment_footer !== null && res.data[0].imaging.branch.appointment_footer !== ''){
                  appointment_footer = htmlToPdfmake(res.data[0].imaging.branch.appointment_footer);
                }

                //Convert HTML to PDF Make syntax:
                if(res.data[0].procedure.preparation !== undefined && res.data[0].procedure.preparation !== '' && res.data[0].procedure.preparation.length > 0){
                  appointment_preparation = res.data[0].procedure.preparation;
                }
                let htmlPreparation = htmlToPdfmake(appointment_preparation);
                this.removeMargin(htmlPreparation);

                //Define document structure:
                docDefinition = {
                  //PAGE MARGINS:
                  pageMargins: [40, 90, 40, 40],

                  //HEADER:
                  header: this.logoPDFContent,

                  //FOOTER:
                  footer: (currentPage: any, pageCount: any) => { return { table: { widths: [ "*"], body: [[ {
                      text: 'Página: ' + currentPage.toString() + ' de ' + pageCount,
                      alignment: 'right',
                      fontSize: 8,
                      margin: [0, 10, 20, 0]
                    } ]] },
                    layout: 'noBorders'
                  }; },

                  //CONTENT:
                  content: [
                    // TITLE:
                    { text: 'Comprobante de cita:', style: 'header'},

                    // DATOS DE REALIZACIÓN:
                    {
                      style: 'main_table',
                      table: {
                        widths: ['*', '*', '*', '*'],
                        body: [
                          [{ text: 'REALIZACIÓN', colSpan: 4, style: 'header_table' }, {}, {}, {}],
                          [{ text: 'Organización', style: 'label_table' }, res.data[0].imaging.organization.short_name, { text: 'Fecha de cita', style: 'label_table' }, datetime.dateDay + '/' + datetime.dateMonth + '/' + datetime.dateYear ],
                          [{ text: 'Sucursal', style: 'label_table' }, res.data[0].imaging.branch.short_name, { text: 'Horario de cita', style: 'label_table' }, datetime.startHours + ':' + datetime.startMinutes + ' hs'],
                          [{ text: 'Servicio', style: 'label_table' }, res.data[0].imaging.service.name, { text: 'Procedimiento', style: 'label_table' }, res.data[0].procedure.name]
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
                          [{ text: 'Documento', style: 'label_table' }, res.data[0].patient.person.documents[0].document],
                          [{ text: 'Nombre/s', style: 'label_table' }, patient_complete_name.names],
                          [{ text: 'Apellido/s', style: 'label_table' }, patient_complete_name.surnames],
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
                          [ htmlPreparation ]
                        ]
                      }
                    },

                    //FOOTER:
                    {
                      text: appointment_footer,
                      style: 'html-p'
                    }
                  ],

                  //IMAGES:
                  images: this.logoPDFStyle,

                  //STYLES:
                  styles: {
                    footer: {
                      fontSize: 10,
                      alignment: 'center'
                    },
                    header: {
                      margin: [0, 0, 0, 10],
                      fontSize: 13,
                      bold: true,
                      decoration: 'underline'
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
                    },
                    'html-p': {
                      fontSize: 10
                    },
                    'html-ul': {
                      fontSize: 10
                    },
                  }
                };

                //Get timestamp:
                const timestamp = this.sharedFunctions.getTimeStamp();

                //Create PDF Document:
                pdfDocument = pdfMake.createPdf(docDefinition);

                //Open PDF Document in browser:
                if(open_document){
                  pdfDocument.download(
                    timestamp + '_CITA_' +
                    res.data[0].patient.person.documents[0].document + '_' +
                    res.data[0].patient.person.name_01 + '_' +
                    res.data[0].patient.person.surname_01 +
                    '.pdf'
                  );
                }
              }

              //Return response:
              return res;
            })
          );

          //Observe content (Subscribe):
          obsAppointment.subscribe({
            next: (res: any) => {
              //Check operation status:
              if(res.success === false){
                this.sharedFunctions.sendMessage('Hubo un problema al intentar generar el PDF con el _id especificado. ' + res.message);
              
              //Check if mail is required:
              } else if(send_mail){
                //Build mail body (message):
                const body_message = this.logoEmailContent + 
                '<p>' + 
                  '<strong>Estimado/a ' + patient_complete_name.names + ' ' + patient_complete_name.surnames + ',</strong><br/>' +
                  '<br/>Su cita ha sido reservada correctamente.<br/>' + 
                  '<strong>Datos de la reserva:</strong>' +
                  '<ul>' + 
                    '<li><strong>Fecha:</strong> ' + datetime.dateDay + '/' + datetime.dateMonth + '/' + datetime.dateYear + '</li>' + 
                    '<li><strong>Hora:</strong> ' + datetime.startHours + ':' + datetime.startMinutes + ' hs' + '</li>' + 
                  '</ul>' + 
                  '<br/>' + 
                  '<strong>Preparación previa:</strong>' + appointment_preparation + 
                  '<br/>' + 
                  '<small><i>Este es un correo automático, por favor no responda a esta dirección.</i></small>' + 
                  '<br/><br/>' + 
                '</p>';

                //Set mail destination:
                if(email_destination == undefined || email_destination == null || email_destination == ''){
                  email_destination = res.data[0].patient.email;
                }
                
                //Get the PDF Document as base64 data:
                pdfDocument.getBase64((base64Document: any) => {
                  //Set mail options:
                  const mailOptions = {
                    to        : email_destination,
                    subject   : res.data[0].imaging.organization.name + ' - Comprobante de cita (Sirius RIS)',
                    message   : body_message,
                    filename  : 'Comprobante_de_cita.pdf',
                    base64    : base64Document,

                    //Log info (Not deductible from backend):
                    element_id    : res.data[0]._id,
                    element_type  : 'appointments'
                  };

                  //Send email:
                  this.sendMail(mailOptions, open_document);
                });
              }
            },
            error: res => {
              //Send snakbar message:
              if(res.error.message){
                //Check if have details error:
                if(res.error.error){
                  this.sharedFunctions.sendMessage(res.error.message + ' Error: ' + res.error.error);
                } else {
                  //Send other errors:
                  this.sharedFunctions.sendMessage(res.error.message);
                }
              } else {
                this.sharedFunctions.sendMessage('Error: No se obtuvo respuesta del servidor backend.');
              }
            }
          });

        break;

        // PDF REPORT (AUTHENTICATED BASE64 PDF REPORT):
        case 'report':
          //Set params:
          const base64ReportParams = {
            'filter[fk_performing]' : _id,
            'proj[patient]'         : 1,
            'proj[authenticated]'   : 1,
            'proj[appointment.imaging.organization]' : 1,
            'proj[appointment.imaging.branch]' : 1,
            'proj[performing.date]' : 1,

            //Make sure the first report is the most recent:
            'sort[createdAt]'       : -1
          };
          
          //Find base64 report by _id:
          //Use Api Client to prevent reload current list response [sharedFunctions.find -> this.response = res].
          this.apiClient.sendRequest('GET', 'reports/findOne', base64ReportParams).subscribe({
            next: async res => {
              //Check result:
              if(res.success){
                if(Object.keys(res.data).length > 0){
                  //Set logos:
                  this.setLogos(res.data[0].appointment.imaging);

                  //Open PDF Document in browser:
                  if(open_document){
                    //Set link source (base64):
                    const linkSource ='data:application/octet-stream;base64,' + res.data[0].authenticated.base64_report;

                    //Create link to enable browser download dialog:
                    const downloadLink = document.createElement('a');

                    //Set downloadLink href:
                    downloadLink.href = linkSource;

                    //Get timestamp:
                    const timestamp = this.sharedFunctions.getTimeStamp();

                    //Set name of the file to download:
                    downloadLink.download = timestamp + '_INFORME_' + 
                    res.data[0].patient.person.documents[0].document + '_' +
                    res.data[0].patient.person.name_01 + '_' + 
                    res.data[0].patient.person.surname_01 + 
                    '.pdf';

                    //Trigger click (download):
                    downloadLink.click();
                  }

                  //Check if mail is required:
                  if(send_mail){
                    //Get complete name:
                    const patient_complete_name = this.getCompleteName(res.data[0].patient.person);

                    //Datetime:
                    const datetime = await this.sharedFunctions.datetimeFulCalendarFormater(new Date(res.data[0].performing.date), new Date(res.data[0].performing.date));

                    //Build mail body (message):
                    const body_message = this.logoEmailContent + 
                    '<p>' + 
                        '<strong>Estimado/a ' + patient_complete_name.names + ' ' + patient_complete_name.surnames + ',</strong><br/>' +
                        '<br/>Le enviamos <strong>adjunto</strong> a este correo electrónico el <strong>informé médico</strong> del estudio realizado sobre la fecha <strong>' + datetime.dateDay + '/' + datetime.dateMonth + '/' + datetime.dateYear + '</strong>.<br/>' + 
                        '<br/>' + 
                        '<small><i>Este es un correo automático, por favor no responda a esta dirección.</i></small>' + 
                        '<br/><br/>' + 
                    '</p>';

                    //Set mail destination:
                    if(email_destination == undefined || email_destination == null || email_destination == ''){
                      email_destination = res.data[0].patient.email;
                    }

                    //Set mail options:
                    const mailOptions = {
                      to            : email_destination,
                      subject       : res.data[0].appointment.imaging.organization.name + ' - Comprobante de cita (Sirius RIS)',
                      message       : body_message,
                      filename      : 'Informe_medico.pdf',
                      base64        : res.data[0].authenticated.base64_report,

                      //Log info (Not deductible from backend):
                      element_id    : res.data[0]._id,
                      element_type  : 'reports'
                    };

                    //Send email:
                    this.sendMail(mailOptions, open_document);
                  }

                } else {
                  //Send message (no records found):
                  this.sharedFunctions.sendMessage(res.message);
                }
              } else {
                //Send message (success false):
                this.sharedFunctions.sendMessage(res.message);
              }
            },
            error: res => {
              //Send error:
              this.sharedFunctions.sendMessage(res.error.message);
            }
          });

          break;

        // PDF REPORT DRAFT:
        case 'report_draft':
          //Set params:
          const reportParams = {
            'filter[fk_performing]'       : _id,

            //Project report content:
            'proj[clinical_info]'           : 1,
            'proj[procedure_description]'   : 1,
            'proj[findings]'                : 1,
            'proj[summary]'                 : 1,
            'proj[createdAt]'               : 1,

            //Project performing content:
            'proj[performing.date]'         : 1,
            'proj[procedure.name]'          : 1,
            
            //Appointment content:
            'proj[appointment.imaging.organization]' : 1,
            'proj[appointment.imaging.branch]' : 1,

            //Project patient content:
            'proj[patient]'                 : 1,

            //Make sure the first report is the most recent:
            'sort[createdAt]'               : -1
          };

          //Find report by _id:
          //Use Api Client to prevent reload current list response [sharedFunctions.find -> this.response = res].
          const obsReport = this.apiClient.sendRequest('GET', 'reports/findOne', reportParams).pipe(
            map(async (res: any) => {
              //Check operation status:
              if(res.success === true){
                //Set logos:
                this.setLogos(res.data[0].appointment.imaging);

                //FORMATING DATA:
                //Get patient complete name:
                let patient_complete_name: any = this.getCompleteName(res.data[0].patient.person);
                patient_complete_name = patient_complete_name.names + ' ' + patient_complete_name.surnames;

                //Datetime:
                const datetime = this.sharedFunctions.datetimeFulCalendarFormater(new Date(res.data[0].performing.date), new Date(res.data[0].performing.date));
                const performing_datetime = datetime.dateDay + '/' + datetime.dateMonth + '/' + datetime.dateYear + ' ' + datetime.startHours + ':' + datetime.startMinutes + ' hs';

                //Authenticate message:
                const authMessage = 'Autenticado digitalmente por NOMBRE COMPLETO AUTENTICADOR en fecha del FECHA Y HORA actuando para la institución ' + res.data[0].appointment.imaging.organization.name + ' con OID ' + res.data[0].appointment.imaging.organization.OID;

                //Signatures message:
                const signMessage = 'Firmado por médico/s: NOMBRE COMPLETO MÉDICOS FIRMANTES | ' + res.data[0].appointment.imaging.organization.short_name;

                //Convert HTML to PDF Make syntax:
                let htmlClinicalInfo: any = htmlToPdfmake('<p>El informe <strong>NO posee dato clínico.</strong><p>');
                if(res.data[0].clinical_info !== undefined && res.data[0].clinical_info !== null && res.data[0].clinical_info !== ''){
                  htmlClinicalInfo = htmlToPdfmake(res.data[0].clinical_info);
                }
                await this.removeMargin(htmlClinicalInfo);

                let htmlProcedureDescription = htmlToPdfmake('<p>El informe <strong>NO posee procedimiento.</strong><p>');
                if(res.data[0].procedure_description !== undefined && res.data[0].procedure_description !== null && res.data[0].procedure_description !== ''){
                  htmlProcedureDescription = htmlToPdfmake(res.data[0].procedure_description);
                }
                await this.removeMargin(htmlProcedureDescription);

                
                let htmlFindings = htmlToPdfmake('<p>El informe <strong>NO posee hallazgos.</strong><p>');
                if(res.data[0].findings[0].procedure_findings !== undefined && res.data[0].findings[0].procedure_findings !== null && res.data[0].findings[0].procedure_findings !== ''){
                  htmlFindings = htmlToPdfmake(res.data[0].findings[0].procedure_findings);
                }
                await this.removeMargin(htmlFindings);

                let htmlSummary = htmlToPdfmake('<p>El informe <strong>NO posee en suma.</strong><p>');
                if(res.data[0].summary !== undefined && res.data[0].summary !== null && res.data[0].summary !== ''){
                  htmlSummary = htmlToPdfmake(res.data[0].summary);
                }
                await this.removeMargin(htmlSummary);

                //Findings title:
                const findingsTitle = res.data[0].findings[0].title + ':';

                //Define document structure:
                docDefinition = {
                  //PAGE MARGINS:
                  pageMargins: [40, 90, 40, 40],

                  //HEADER:
                  header: this.logoPDFContent,

                  //FOOTER:
                  footer: (currentPage: any, pageCount: any) => { return { table: { widths: [ "*"], body: [[ {
                      text: 'Página: ' + currentPage.toString() + ' de ' + pageCount,
                      alignment: 'right',
                      fontSize: 8,
                      margin: [0, 10, 20, 0]
                    } ]] },
                    layout: 'noBorders'
                  }; },

                  //CONTENT:
                  content: [
                    // PERFORMING DATA:
                    {
                      type: 'none',
                      ol: [
                        { text: patient_complete_name, bold: true },
                        res.data[0].patient.person.documents[0].document,
                        res.data[0].procedure.name,
                        performing_datetime
                      ],
                      style: 'performing_data',
                    },
                    
                    // SEPARATOR LINE:
                    { canvas: [ { type: 'line', lineColor: '#777777', x1: 0, y1: 0, x2: 515, y2: 0, lineWidth: 0.5 } ] },
                        
                    // CLINICAL INFO:
                    {
                      text: 'Dato clínico:',
                      style: 'subheader',
                      margin: [0, 10, 0, 0]
                    },
                    htmlClinicalInfo,
                    
                    '\n',
                    
                    // PROCEDURE:
                    {
                      text: 'Procedimiento:',
                      style: 'subheader'
                    },
                    htmlProcedureDescription,
                    
                    '\n',
                    
                    // FINDINGS:
                    {
                      text: findingsTitle,
                      style: 'subheader'
                    },
                    htmlFindings,
                    
                    '\n',
                    
                    // SUMMARY:
                    {
                      text: 'En suma:',
                      style: 'subheader'
                    },
                    htmlSummary,
                        
                    '\n\n',
                        
                    //SEPARATOR LINE:
                    { canvas: [ { type: 'line', lineColor: '#777777', x1: 0, y1: 0, x2: 515, y2: 0, lineWidth: 0.5 } ] },
                        
                    //SIGNATURES:
                    {
                      text: signMessage,
                      style: 'sign_auth',
                      margin: [0, 3, 0, 0]
                    },
                        
                    //AUTHENTICATION:
                    {
                      text: authMessage,
                      style: 'sign_auth'
                    }
                  ],
                  
                  //IMAGES:
                  images: this.logoPDFStyle,
                  
                  //STYLES:
                  styles: {
                    defaultStyle: {
                      fontSize: 10
                    },
                    header: {
                        margin: [0, 0, 0, 10],
                        fontSize: 14,
                        bold: true,
                        alignment: 'center'
                    },
                    subheader: {
                        fontSize: 12,
                        bold: true,
                        decoration: 'underline'
                    },
                    'html-p': {
                      fontSize: 10
                    },
                    'html-ul': {
                      fontSize: 10
                    },
                    sign_auth: {
                      fontSize: 8
                    },
                    performing_data: {
                      margin: [-11, 0, 0, 9],
                      fontSize: 9
                    }
                  }
                };
              }

              //Get timestamp:
              const timestamp = this.sharedFunctions.getTimeStamp();

              //Create PDF Document:
              const pdfDocument = pdfMake.createPdf(docDefinition);

              //Open PDF Document in browser:
              pdfDocument.download(
                timestamp + '_INFORME_' +
                res.data[0].patient.person.documents[0].document + '_' +
                res.data[0].patient.person.name_01 + '_' +
                res.data[0].patient.person.surname_01 +
                '.pdf'
              );

              //Return response:
              return res;
            })
          );

          //Observe content (Subscribe):
          obsReport.subscribe();
          break;
      }

    } else {
      //Send message:
      this.sharedFunctions.sendMessage('El _id especificado no es válido (No es ObjectId).');
    }
  }

  getCompleteName(person: any){
    //Names:
    let names = person.name_01;
    if(person.name_02 !== '' && person.name_02 !== undefined && person.name_02 !== null){
      names += ' ' + person.name_02;
    }

    //Surnames:
    let surnames = person.surname_01;
    if(person.surname_02 !== '' && person.surname_02 !== undefined && person.surname_02 !== null){
      surnames += ' ' + person.surname_02;
    }

    //Return complete name:
    return { names : names, surnames: surnames };
  }

  private sendMail(mailOptions: any, open_document: boolean){
    //Send email:
    this.apiClient.sendRequest('POST', 'mail/send', mailOptions).subscribe({
      next: (mailRes: any) => {
        //Check mail operation status:
        if(open_document == false){
          this.sharedFunctions.sendMessage(mailRes.message);
        }
      },
      error: mailRes => {
        this.sharedFunctions.sendMessage(mailRes.message);
      }
    });
  }

  //Fix pdfMake does not generate line breaks between paragraphs in 'text' object field.
  //Remove excesive margin between paragraphs (htmlToPdfMake).
  private async removeMargin(htmlToPdfmake_result: any){
    await Promise.all(Object.keys(htmlToPdfmake_result).map(key => {
      delete htmlToPdfmake_result[key].margin;
    }));
  }

  private setLogos(imaging: any){
    //Reset logos:
    this.organizationLogo = null;
    this.branchLogo       = null;
    this.logoEmailContent = '';
    this.logoPDFContent   = '';
    this.logoPDFStyle     = {};

    //FORMATING DATA:
    //Set header logos:
    if(imaging.organization.base64_logo !== undefined && imaging.organization.base64_logo !== null && imaging.organization.base64_logo !== '' && this.regexBase64.test(imaging.organization.base64_logo)){
      this.organizationLogo = 'data:image/png;base64,' + imaging.organization.base64_logo;
    }

    if(imaging.branch.base64_logo !== undefined && imaging.branch.base64_logo !== null && imaging.branch.base64_logo !== '' && this.regexBase64.test(imaging.branch.base64_logo)){
      this.branchLogo = 'data:image/png;base64,' + imaging.branch.base64_logo;
    }

    //Two logos (organization and branch):
    if(this.organizationLogo !== null && this.branchLogo !== null){
      //Set email logo content:
      this.logoEmailContent = '<img src="' + this.branchLogo + '" width="300" /><br/><br/>';

      //Set logo style:
      this.logoPDFStyle = { 
        organizationLogo: this.organizationLogo,
        branchLogo: this.branchLogo
      };

      //Set logo content:
      this.logoPDFContent = {
        table: {
          widths: ['*', 1, '*'], //Three columns, the middle one 1px (Spacing)
          body: [
            [
              {
                image: 'organizationLogo',
                width: 220,
                alignment: 'center',
                margin: [0, 20, 0, 0],
                opacity: 0.8
              },
              ' ', //Spacing
              {
                image: 'branchLogo',
                width: 220,
                alignment: 'center',
                margin: [0, 20, 0, 0],
                opacity: 0.8
              },
            ],
          ]
        },
          layout: 'noBorders'
      };
      
    //Organization logo only:
    } else if(this.organizationLogo !== null){
      //Set email logo content:
      this.logoEmailContent = '<img src="' + this.organizationLogo + '" width="300" /><br/><br/>';

      //Set logo style:
      this.logoPDFStyle = { organizationLogo: this.organizationLogo };

      //Set logo content:
      this.logoPDFContent = {
        image: 'organizationLogo',
        width: 220,
        alignment: 'center',
        margin: [0, 20, 0, 0],
        opacity: 0.8
      };

    //Branch logo only:
    } else if(this.branchLogo !== null){
      //Set email logo content:
      this.logoEmailContent = '<img src="' + this.branchLogo + '" width="300" /><br/><br/>';

      //Set logo style:
      this.logoPDFStyle = { branchLogo: this.branchLogo };

      //Set logo content:
      this.logoPDFContent = {
        image: 'branchLogo',
        width: 220,
        alignment: 'center',
        margin: [0, 20, 0, 0],
        opacity: 0.8
      };
    }
  }
}
