//--------------------------------------------------------------------------------------------------------------------//
// REPORT SERVICES:
//--------------------------------------------------------------------------------------------------------------------//
//Set font descriptors:
const fonts = {
    Roboto: {
        normal        : './assets/fonts/roboto/Roboto-Regular.ttf',
        bold          : './assets/fonts/roboto/Roboto-Medium.ttf',
        italics       : './assets/fonts/roboto/Roboto-Italic.ttf',
        bolditalics   : './assets/fonts/roboto/Roboto-MediumItalic.ttf'
    }
};

//Import external modules:
const concat        = require('concat-stream');
const moment        = require('moment');
const mongoose      = require('mongoose');
const cryptoJS      = require('crypto-js');

//PDFMake Server side:
const fs            = require('fs');
const PdfPrinter    = require('pdfmake');
const printer       = new PdfPrinter(fonts);

//Import signer service module:
const signerService = require('./signer.service');

//HTML to PDFMake:
var jsdom = require("jsdom");
var { JSDOM } = jsdom;
var { window } = new JSDOM("");
const htmlToPdfmake = require("html-to-pdfmake");

//Import app modules:
const mainServices  = require('../../main.services');
const mainSettings  = mainServices.getFileSettings();                            // File settings (YAML)
const currentLang   = require('../../main.languages')(mainSettings.language);    // Language Module

//Import schemas:
const reports       = require('./schemas');
const people        = require('../people/schemas');
const performing    = require('../performing/schemas');

//Set Base64 Regex to validate:
const regexBase64 = /^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=|[A-Za-z0-9+/]{4})$/;

//--------------------------------------------------------------------------------------------------------------------//
// CREATE SESSION:
//--------------------------------------------------------------------------------------------------------------------//
async function createBase64Report(req, res, auth_fk_person, auth_datetime, obj_logos){
    //Set reports aggregate (same as find reports handler but with match _id):
    let reports_aggregate = [
        //Performing (Lookup & Unwind):
        { $lookup: {
            from: 'performing',
            localField: 'fk_performing',
            foreignField: '_id',
            as: 'performing',
        }},
        { $unwind: { path: "$performing", preserveNullAndEmptyArrays: true } },

        //Performing -> Appointment (Lookup & Unwind):
        { $lookup: {
            from: 'appointments',
            localField: 'performing.fk_appointment',
            foreignField: '_id',
            as: 'appointment',
        }},
        { $unwind: { path: "$appointment", preserveNullAndEmptyArrays: true } },

        //------------------------------------------------------------------------------------------------------------//
        // PERFORMING -> APPOINTMENT IMAGING:
        //------------------------------------------------------------------------------------------------------------//
        //Organizations lookup:
        { $lookup: {
            from: 'organizations',
            localField: 'appointment.imaging.organization',
            foreignField: '_id',
            as: 'appointment.imaging.organization',
        }},

        //Branches lookup:
        { $lookup: {
            from: 'branches',
            localField: 'appointment.imaging.branch',
            foreignField: '_id',
            as: 'appointment.imaging.branch',
        }},

        //Services lookup:
        { $lookup: {
            from: 'services',
            localField: 'appointment.imaging.service',
            foreignField: '_id',
            as: 'appointment.imaging.service',
        }},

        //Unwind:
        { $unwind: { path: "$appointment.imaging.organization", preserveNullAndEmptyArrays: true } },
        { $unwind: { path: "$appointment.imaging.branch", preserveNullAndEmptyArrays: true } },
        { $unwind: { path: "$appointment.imaging.service", preserveNullAndEmptyArrays: true } },
        //------------------------------------------------------------------------------------------------------------//

        //------------------------------------------------------------------------------------------------------------//
        // PERFORMING -> APPOINTMENT REFERRING:
        //------------------------------------------------------------------------------------------------------------//
        //Organizations lookup:
        { $lookup: {
            from: 'organizations',
            localField: 'appointment.referring.organization',
            foreignField: '_id',
            as: 'appointment.referring.organization',
        }},

        //Branches lookup:
        { $lookup: {
            from: 'branches',
            localField: 'appointment.referring.branch',
            foreignField: '_id',
            as: 'appointment.referring.branch',
        }},

        //Services lookup:
        { $lookup: {
            from: 'services',
            localField: 'appointment.referring.service',
            foreignField: '_id',
            as: 'appointment.referring.service',
        }},

        //Users lookup:
        { $lookup: {
            from: 'users',
            localField: 'appointment.referring.fk_referring',
            foreignField: '_id',
            as: 'appointment.referring.fk_referring',
        }},

        //Unwind:
        { $unwind: { path: "$appointment.referring.organization", preserveNullAndEmptyArrays: true } },
        { $unwind: { path: "$appointment.referring.branch", preserveNullAndEmptyArrays: true } },
        { $unwind: { path: "$appointment.referring.service", preserveNullAndEmptyArrays: true } },
        { $unwind: { path: "$appointment.referring.fk_referring", preserveNullAndEmptyArrays: true } },
        //------------------------------------------------------------------------------------------------------------//

        //------------------------------------------------------------------------------------------------------------//
        // PERFORMING -> APPOINTMENT REPORTING:
        //------------------------------------------------------------------------------------------------------------//
        //Organizations lookup:
        { $lookup: {
            from: 'organizations',
            localField: 'appointment.reporting.organization',
            foreignField: '_id',
            as: 'appointment.reporting.organization',
        }},

        //Branches lookup:
        { $lookup: {
            from: 'branches',
            localField: 'appointment.reporting.branch',
            foreignField: '_id',
            as: 'appointment.reporting.branch',
        }},

        //Services lookup:
        { $lookup: {
            from: 'services',
            localField: 'appointment.reporting.service',
            foreignField: '_id',
            as: 'appointment.reporting.service',
        }},

        //Users lookup:
        { $lookup: {
            from: 'users',
            localField: 'appointment.reporting.fk_reporting',
            foreignField: '_id',
            as: 'appointment.reporting.fk_reporting',
        }},

        //Unwind:
        { $unwind: { path: "$appointment.reporting.organization", preserveNullAndEmptyArrays: true } },
        { $unwind: { path: "$appointment.reporting.branch", preserveNullAndEmptyArrays: true } },
        { $unwind: { path: "$appointment.reporting.service", preserveNullAndEmptyArrays: true } },
        { $unwind: { path: "$appointment.reporting.fk_reporting", preserveNullAndEmptyArrays: true } },
        //------------------------------------------------------------------------------------------------------------//

        //------------------------------------------------------------------------------------------------------------//
        // PERFORMING -> APPOINTMENT PATIENT:
        //------------------------------------------------------------------------------------------------------------//
        //Patient (Lookup & Unwind):
        { $lookup: {
            from: 'users',
            localField: 'appointment.fk_patient',
            foreignField: '_id',
            as: 'patient',
        }},
        { $unwind: { path: "$patient", preserveNullAndEmptyArrays: true } },

        //Patient -> Person (Lookup & Unwind):
        { $lookup: {
            from: 'people',
            localField: 'patient.fk_person',
            foreignField: '_id',
            as: 'patient.person',
        }},
        { $unwind: { path: "$patient.person", preserveNullAndEmptyArrays: true } },
        //------------------------------------------------------------------------------------------------------------//

        //------------------------------------------------------------------------------------------------------------//
        // PERFORMING -> AUTHENTICATED USER:
        //------------------------------------------------------------------------------------------------------------//
        //Authenticated user (Lookup & Unwind):
        { $lookup: {
            from: 'users',
            localField: 'authenticated.fk_user',
            foreignField: '_id',
            as: 'authenticated.user',
        }},
        { $unwind: { path: "$authenticated.user", preserveNullAndEmptyArrays: true } },

        //Authenticated user -> Person (Lookup & Unwind):
        { $lookup: {
            from: 'people',
            localField: 'authenticated.user.fk_person',
            foreignField: '_id',
            as: 'authenticated.user.person',
        }},
        { $unwind: { path: "$authenticated.user.person", preserveNullAndEmptyArrays: true } },
        //------------------------------------------------------------------------------------------------------------//

        //Performing Equipment (Lookup & Unwind):
        { $lookup: {
            from: 'equipments',
            localField: 'performing.fk_equipment',
            foreignField: '_id',
            as: 'equipment',
        }},
        { $unwind: { path: "$equipment", preserveNullAndEmptyArrays: true } },

        //Performing Procedure (Lookup & Unwind):
        { $lookup: {
            from: 'procedures',
            localField: 'performing.fk_procedure',
            foreignField: '_id',
            as: 'procedure',
        }},
        { $unwind: { path: "$procedure", preserveNullAndEmptyArrays: true } },
        
        //Performing Procedure -> Modality (Lookup & Unwind):
        { $lookup: {
            from: 'modalities',
            localField: 'procedure.fk_modality',
            foreignField: '_id',
            as: 'modality',
        }},
        { $unwind: { path: "$modality", preserveNullAndEmptyArrays: true } },

        //Performing Injection Users (Lookup & Unwind):
        { $lookup: {
            from: 'users',
            localField: 'performing.injection.injection_user',
            foreignField: '_id',
            as: 'performing.injection.injection_user',
        }},
        { $unwind: { path: "$performing.injection.injection_user", preserveNullAndEmptyArrays: true } },

        //Performing Injection (User) -> People (Lookup & Unwind):
        { $lookup: {
            from: 'people',
            localField: 'performing.injection.injection_user.fk_person',
            foreignField: '_id',
            as: 'performing.injection.injection_user.person',
        }},
        { $unwind: { path: "$performing.injection.injection_user.person", preserveNullAndEmptyArrays: true } },

        //Performing PET-CT Laboratory user (Lookup & Unwind):
        { $lookup: {
            from: 'users',
            localField: 'performing.injection.pet_ct.laboratory_user',
            foreignField: '_id',
            as: 'performing.injection.pet_ct.laboratory_user',
        }},
        { $unwind: { path: "$performing.injection.pet_ct.laboratory_user", preserveNullAndEmptyArrays: true } },

        //Performing PET-CT Laboratory user (User) -> People (Lookup & Unwind):
        { $lookup: {
            from: 'people',
            localField: 'performing.injection.pet_ct.laboratory_user.fk_person',
            foreignField: '_id',
            as: 'performing.injection.pet_ct.laboratory_user.person',
        }},
        { $unwind: { path: "$performing.injection.pet_ct.laboratory_user.person", preserveNullAndEmptyArrays: true } },

        //Performing Acquisition console technician Users (Lookup & Unwind):
        { $lookup: {
            from: 'users',
            localField: 'performing.acquisition.console_technician',
            foreignField: '_id',
            as: 'performing.acquisition.console_technician',
        }},
        { $unwind: { path: "$performing.acquisition.console_technician", preserveNullAndEmptyArrays: true } },

        //Performing Acquisition console technician (User) -> People (Lookup & Unwind):
        { $lookup: {
            from: 'people',
            localField: 'performing.acquisition.console_technician.fk_person',
            foreignField: '_id',
            as: 'performing.acquisition.console_technician.person',
        }},
        { $unwind: { path: "$performing.acquisition.console_technician.person", preserveNullAndEmptyArrays: true } },

        //------------------------------------------------------------------------------------------------------------//
        // PATHOLOGIES:
        //------------------------------------------------------------------------------------------------------------//
        //Pathologies lookup [Array]:
        { $lookup: {
            from: 'pathologies',
            localField: 'fk_pathologies',
            foreignField: '_id',
            as: 'pathologies'
        }},
        //------------------------------------------------------------------------------------------------------------//

        //------------------------------------------------------------------------------------------------------------//
        // MEDICAL SIGNATURES:
        //------------------------------------------------------------------------------------------------------------//
        //Medical signatures lookup [Array of Objects]:
        { $lookup: {
            from: 'signatures',
            localField: 'medical_signatures',
            foreignField: '_id',
            as: 'medical_signatures'
        }},
        { $unwind: { path: "$medical_signatures", preserveNullAndEmptyArrays: true } },

        //User signatures lookup (Lookup & Unwind):
        { $lookup: {
            from: 'users',
            localField: 'medical_signatures.fk_user',
            foreignField: '_id',
            as: 'medical_signatures.user',
        }},
        { $unwind: { path: "$medical_signatures.user", preserveNullAndEmptyArrays: true } },

        //User signatures -> Person (Lookup & Unwind):
        { $lookup: {
            from: 'people',
            localField: 'medical_signatures.user.fk_person',
            foreignField: '_id',
            as: 'medical_signatures.user.person',
        }},
        { $unwind: { path: "$medical_signatures.user.person", preserveNullAndEmptyArrays: true } },

        //Group array of objects:
        { $group: {
            //Preserve _id:
            _id             : '$_id',
            
            //Preserve root document:            
            first: { "$first": "$$ROOT" },

            //Group $lookup result to existing array:
            medical_signatures: { "$push": "$medical_signatures" },
        }},

        //Replace root document (Merge objects):
        { $replaceRoot: {
            newRoot: {
                $mergeObjects: [
                    "$first",
                    { medical_signatures: "$medical_signatures" }
                ]
            }
        }},
        //------------------------------------------------------------------------------------------------------------//

        //------------------------------------------------------------------------------------------------------------//
        // REMOVE DUPLICATED VALUES (SET DEFAULT PROJECTION):
        // Important note: Request project replaces the aggregation projection (This prevent mix content proj error).
        //------------------------------------------------------------------------------------------------------------//
        { $project: {
            //Self:
            // In reports createdAt and updatedAt are required by default.
            //'createdAt': 0, 
            //'updatedAt': 0,
            '__v': 0,

            //Performing:
            'performing.createdAt': 0,
            'performing.updatedAt': 0,
            'performing.__v': 0,

            //Appointment:
            'appointment.createdAt': 0,
            'appointment.updatedAt': 0,
            'appointment.__v': 0,

            //Appointment patient:
            'appointment.fk_patient': 0,
            'patient.fk_person': 0,
            'patient.password': 0,
            'patient.permissions': 0,
            'patient.settings': 0,
            'patient.createdAt': 0,
            'patient.updatedAt': 0,
            'patient.__v': 0,
            'patient.person.createdAt': 0,
            'patient.person.updatedAt': 0,
            'patient.person.__v': 0,

            //Appointment imaging:
            'appointment.imaging.organization.createdAt': 0,
            'appointment.imaging.organization.updatedAt': 0,
            'appointment.imaging.organization.__v': 0,
            //'appointment.imaging.organization.base64_logo': 0,    //Needed to set header logos
            //'appointment.imaging.organization.base64_cert': 0,
            //'appointment.imaging.organization.password_cert': 0,  //Needed to sign report

            'appointment.imaging.branch.createdAt': 0,
            'appointment.imaging.branch.updatedAt': 0,
            'appointment.imaging.branch.__v': 0,
            //'appointment.imaging.branch.base64_logo': 0,          //Needed to set header logos

            'appointment.imaging.service.createdAt': 0,
            'appointment.imaging.service.updatedAt': 0,
            'appointment.imaging.service.__v': 0,

            //Appointment referring:
            'appointment.referring.organization.createdAt': 0,
            'appointment.referring.organization.updatedAt': 0,
            'appointment.referring.organization.__v': 0,
            'appointment.referring.organization.base64_logo': 0,
            'appointment.referring.organization.base64_cert': 0,
            'appointment.referring.organization.password_cert': 0,

            'appointment.referring.branch.createdAt': 0,
            'appointment.referring.branch.updatedAt': 0,
            'appointment.referring.branch.__v': 0,
            'appointment.referring.branch.base64_logo': 0,

            'appointment.referring.service.createdAt': 0,
            'appointment.referring.service.updatedAt': 0,
            'appointment.referring.service.__v': 0,

            'appointment.referring.fk_referring.fk_person': 0,
            'appointment.referring.fk_referring.password': 0,
            'appointment.referring.fk_referring.permissions': 0,
            'appointment.referring.fk_referring.settings': 0,
            'appointment.referring.fk_referring.createdAt': 0,
            'appointment.referring.fk_referring.updatedAt': 0,
            'appointment.referring.fk_referring.__v': 0,

            //Appointment reporting:
            'appointment.reporting.organization.createdAt': 0,
            'appointment.reporting.organization.updatedAt': 0,
            'appointment.reporting.organization.__v': 0,
            'appointment.reporting.organization.base64_logo': 0,
            'appointment.reporting.organization.base64_cert': 0,
            'appointment.reporting.organization.password_cert': 0,

            'appointment.reporting.branch.createdAt': 0,
            'appointment.reporting.branch.updatedAt': 0,
            'appointment.reporting.branch.__v': 0,
            'appointment.reporting.branch.base64_logo': 0,

            'appointment.reporting.service.createdAt': 0,
            'appointment.reporting.service.updatedAt': 0,
            'appointment.reporting.service.__v': 0,

            'appointment.reporting.fk_reporting.fk_person': 0,
            'appointment.reporting.fk_reporting.password': 0,
            'appointment.reporting.fk_reporting.permissions': 0,
            'appointment.reporting.fk_reporting.settings': 0,
            'appointment.reporting.fk_reporting.createdAt': 0,
            'appointment.reporting.fk_reporting.updatedAt': 0,
            'appointment.reporting.fk_reporting.__v': 0,

            //Authenticated user:
            'authenticated.fk_user': 0,
            'authenticated.user.fk_person': 0,
            'authenticated.user.password': 0,
            'authenticated.user.permissions': 0,
            'authenticated.user.settings': 0,
            'authenticated.user.createdAt': 0,
            'authenticated.user.updatedAt': 0,
            'authenticated.user.__v': 0,
            'authenticated.user.person.createdAt': 0,
            'authenticated.user.person.updatedAt': 0,
            'authenticated.user.person.__v': 0,

            //Equipment:
            'equipment.createdAt': 0,
            'equipment.updatedAt': 0,
            'equipment.__v': 0,

            //Procedure:
            'procedure.createdAt': 0,
            'procedure.updatedAt': 0,
            'procedure.__v': 0,

            //Procedure Modality:
            'modality.createdAt': 0,
            'modality.updatedAt': 0,
            'modality.__v': 0,

            //Injection:
            'performing.injection.injection_user.fk_person': 0,
            'performing.injection.injection_user.password': 0,
            'performing.injection.injection_user.permissions': 0,
            'performing.injection.injection_user.settings': 0,
            'performing.injection.injection_user.createdAt': 0,
            'performing.injection.injection_user.updatedAt': 0,
            'performing.injection.injection_user.__v': 0,
            'performing.injection.injection_user.person.createdAt': 0,
            'performing.injection.injection_user.person.updatedAt': 0,
            'performing.injection.injection_user.person.__v': 0,

            //PET-CT Laboratory user:
            'performing.injection.pet_ct.laboratory_user.fk_person': 0,
            'performing.injection.pet_ct.laboratory_user.password': 0,
            'performing.injection.pet_ct.laboratory_user.permissions': 0,
            'performing.injection.pet_ct.laboratory_user.settings': 0,
            'performing.injection.pet_ct.laboratory_user.createdAt': 0,
            'performing.injection.pet_ct.laboratory_user.updatedAt': 0,
            'performing.injection.pet_ct.laboratory_user.__v': 0,
            'performing.injection.pet_ct.laboratory_user.person.createdAt': 0,
            'performing.injection.pet_ct.laboratory_user.person.updatedAt': 0,
            'performing.injection.pet_ct.laboratory_user.person.__v': 0,

            //Acquisition:
            'performing.acquisition.console_technician.fk_person': 0,
            'performing.acquisition.console_technician.password': 0,
            'performing.acquisition.console_technician.permissions': 0,
            'performing.acquisition.console_technician.settings': 0,
            'performing.acquisition.console_technician.createdAt': 0,
            'performing.acquisition.console_technician.updatedAt': 0,
            'performing.acquisition.console_technician.__v': 0,
            'performing.acquisition.console_technician.person.createdAt': 0,
            'performing.acquisition.console_technician.person.updatedAt': 0,
            'performing.acquisition.console_technician.person.__v': 0,

            //Pathologies:
            'pathologies.createdAt': 0,
            'pathologies.updatedAt': 0,
            'pathologies.__v': 0,

            //Medical signatures
            //'user_signatures.createdAt': 0,
            'medical_signatures.updatedAt': 0,
            'medical_signatures.__v': 0,

            //User signatures:
            'medical_signatures.user.fk_person': 0,
            'medical_signatures.user.password': 0,
            'medical_signatures.user.permissions': 0,
            'medical_signatures.user.settings': 0,
            'medical_signatures.user.createdAt': 0,
            'medical_signatures.user.updatedAt': 0,
            'medical_signatures.user.__v': 0,
            'medical_signatures.user.person.createdAt': 0,
            'medical_signatures.user.person.updatedAt': 0,
            'medical_signatures.user.person.__v': 0
        }},

        //Add report _id match condition in reports aggregate:
        { '$match' : { _id: mongoose.Types.ObjectId(req.body._id) } }
    ];

    //Initializate operation result and report_complete_data:
    let result = false;
    let report_complete_data = undefined;

    //Get a random number between 100 and 998:
    let random_number = getRandomNumber(100, 998);

    //Get datetime:
    const datetime = moment().format('YYYYMMDD_HHmmssSSS', { trim: false });

    //Set report PDF filename (temp):
    const filename =  datetime + '_' + random_number + '_report.pdf';

    //Find report by _id (Aggregate):
    await reports.Model.aggregate(reports_aggregate)
    .exec()
    .then(async (report_data) => {
        //Set report complete data (clone object - spread operator):
        report_complete_data = { ... report_data[0] };

        //Define document structure:
        const docDefinition = await setReportStructure(req, res, report_complete_data, auth_fk_person, auth_datetime, obj_logos);

        //Create PDF Document with document definition:
        const pdfDocument = printer.createPdfKitDocument(docDefinition);

        //Create file on tmp directory (file write stream):
        const writeStream = fs.createWriteStream('./tmp/' + filename);

        //Write stream with pdfDocument data:
        pdfDocument.pipe(writeStream);
        pdfDocument.end();

        //Check that the write has finished (async write):
        if(await streamController(writeStream) === 'complete'){
            //Check imaging organization certificate:
            if(
                report_complete_data.appointment.imaging.organization.base64_cert !== undefined && report_complete_data.appointment.imaging.organization.base64_cert !== null && report_complete_data.appointment.imaging.organization.base64_cert !== '' &&
                report_complete_data.appointment.imaging.organization.password_cert !== undefined && report_complete_data.appointment.imaging.organization.password_cert !== null && report_complete_data.appointment.imaging.organization.password_cert !== ''
            ){
                //Set report PDF signed filename (temp):
                const signed_filename = datetime + '_' + random_number + '_signed_report.pdf';

                //Decrypt certificate password with JWT Secret:
                let password_cert = cryptoJS.AES.decrypt(report_complete_data.appointment.imaging.organization.password_cert, mainSettings.AUTH_JWT_SECRET);
                password_cert = password_cert.toString(cryptoJS.enc.Utf8);
             
                //Read the PDF we're going to sign:
                const pdfBuffer = fs.readFileSync('./tmp/' + filename);

                //Decode base64 certificate:
                const p12Buffer = Buffer.from(report_complete_data.appointment.imaging.organization.base64_cert, 'base64');

                //Sign PDF report with organization certificates:
                await signerService.signPDF(pdfBuffer, p12Buffer, password_cert, signed_filename);

                //Read created file on tmp directory (read write stream):
                const readStream = fs.createReadStream('./tmp/' + signed_filename, { encoding: 'base64' });
                readStream.pipe(concat((base64) => {
                    result = base64;
                }));

                //Check that the read in base64 encoding has finished (async read):
                if(await streamController(readStream) === 'complete'){
                    //Remove signed report temp file from tmp:
                    fs.unlink('./tmp/' + signed_filename, (error) => {
                        if(error){
                            //Set operation result:
                            result = false;

                            //Send ERROR Message:
                            mainServices.sendConsoleMessage('ERROR', delete_error);
                            throw('Error: ' + error);
                        } else {
                            //Remove report temp file from tmp (Without certificate):
                            fs.unlink('./tmp/' + filename, (error) => {
                                if(error){
                                    //Set operation result:
                                    result = false;

                                    //Send ERROR Message:
                                    mainServices.sendConsoleMessage('ERROR', delete_error);
                                    throw('Error: ' + error);
                                }
                            });
                        }
                    });
                }

            //Without imaging organization certificate:
            } else {
                //Read created file on tmp directory (read write stream):
                const readStream = fs.createReadStream('./tmp/' + filename, { encoding: 'base64' });
                readStream.pipe(concat((base64) => {
                    result = base64;
                }));

                //Check that the read in base64 encoding has finished (async read):
                if(await streamController(readStream) === 'complete'){
                    //Remove temp file from tmp:
                    fs.unlink('./tmp/' + filename, (error) => {
                        if(error){
                            //Set operation result:
                            result = false;

                            //Send ERROR Message:
                            mainServices.sendConsoleMessage('ERROR', delete_error);
                            throw('Error: ' + error);
                        }
                    });
                }
            }
        }
    })
    .catch((err) => {
        //Send error:
        mainServices.sendError(res, currentLang.db.query_error, err);
    });

    //Return result:
    return { base64: result, report_complete_data: report_complete_data };
}
//--------------------------------------------------------------------------------------------------------------------//

//--------------------------------------------------------------------------------------------------------------------//
// STREAM CONTROLLER:
//--------------------------------------------------------------------------------------------------------------------//
async function streamController(stream) {
    return new Promise((resolve, reject) => {
        //For write streams:
        stream.on('finish', () => {
            resolve('complete');
        });

        //For read streams:
        stream.on('end', () => {
            resolve('complete');
        });

        //Handle errors:
        stream.on('error', reject);
    });
}
//--------------------------------------------------------------------------------------------------------------------//

//--------------------------------------------------------------------------------------------------------------------//
// GET RANDOM NUMBER:
//--------------------------------------------------------------------------------------------------------------------//
function getRandomNumber(min, max){
    return Math.floor(Math.random() * (max - min) + min);
}
//--------------------------------------------------------------------------------------------------------------------//

//--------------------------------------------------------------------------------------------------------------------//
// GET COMPLETE NAME:
//--------------------------------------------------------------------------------------------------------------------//
function getCompleteName(person){
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
//--------------------------------------------------------------------------------------------------------------------//

//--------------------------------------------------------------------------------------------------------------------//
// FIND AUTH PERSON:
//--------------------------------------------------------------------------------------------------------------------//
async function findAuthPerson(req, res, auth_fk_person){
    //Initializate result:
    let result = false;

    //Find authenticated person:
    await people.Model.findById(auth_fk_person)
    .exec()
    .then(async (person_data) => {    
        //Set result:
        result = person_data;
    })
    .catch((err) => {
        //Send error:
        mainServices.sendError(res, currentLang.db.query_error, err);
    });

    //Return result:
    return result;
}
//--------------------------------------------------------------------------------------------------------------------//

//--------------------------------------------------------------------------------------------------------------------//
// SET REPORT STRUCTURE:
//--------------------------------------------------------------------------------------------------------------------//
async function setReportStructure(req, res, report_data, auth_fk_person, auth_datetime, obj_logos){
    //FORMATING DATA:
    //Get patient complete name:
    let patient_complete_name = getCompleteName(report_data.patient.person);
    patient_complete_name = patient_complete_name.names + ' ' + patient_complete_name.surnames;

    //Datetime:
    const datetime = mainServices.datetimeFulCalendarFormater(new Date(report_data.performing.date), new Date(report_data.performing.date));
    const performing_datetime = datetime.dateDay + '/' + datetime.dateMonth + '/' + datetime.dateYear + ' ' + datetime.startHours + ':' + datetime.startMinutes + ' hs';

    //Get auth user complete name:
    const auth_user = await findAuthPerson(req, res, auth_fk_person);
    let auth_complete_name = getCompleteName(auth_user);
    auth_complete_name = auth_complete_name.names + ' ' + auth_complete_name.surnames;

    //Authenticate message:
    const authMessage = 'Autenticado digitalmente por ' + auth_complete_name + ' en fecha del ' + auth_datetime + ' actuando para la institución ' + report_data.appointment.imaging.organization.name + ' con OID ' + report_data.appointment.imaging.organization.OID;

    //Medical signatures (await foreach):
    let signatures_users = '';
    await Promise.all(Object.keys(report_data.medical_signatures).map((key) => {
        //Get signatures user complete name:
        let signature_complete_name = getCompleteName(report_data.medical_signatures[key].user.person);
        signature_complete_name = signature_complete_name.names + ' ' + signature_complete_name.surnames;

        //Concat signature users:
        signatures_users += signature_complete_name + ', ';
    }));

    //Signatures message:
    const signMessage = 'Firmado por médico/s: ' + signatures_users.substring(0, signatures_users.length - 2) + ' | ' + report_data.appointment.imaging.organization.short_name;

    //Convert HTML to PDF Make syntax:
    let htmlClinicalInfo = htmlToPdfmake('<p>El informe <strong>NO posee dato clínico.</strong><p>', { window : window });
    if(report_data.clinical_info !== undefined && report_data.clinical_info !== null && report_data.clinical_info !== ''){
        htmlClinicalInfo = htmlToPdfmake(report_data.clinical_info, { window : window });
    }
    await removeMargin(htmlClinicalInfo);

    let htmlProcedureDescription = htmlToPdfmake('<p>El informe <strong>NO posee dato procedimiento.</strong><p>', { window : window });
    if(report_data.procedure_description !== undefined && report_data.procedure_description !== null && report_data.procedure_description !== ''){
        htmlProcedureDescription = htmlToPdfmake(report_data.procedure_description, { window : window });
    }
    await removeMargin(htmlProcedureDescription);
            
    let htmlFindings = htmlToPdfmake('<p>El informe <strong>NO posee hallazgos.</strong><p>', { window : window });
    if(report_data.findings[0].procedure_findings !== undefined && report_data.findings[0].procedure_findings !== null && report_data.findings[0].procedure_findings !== ''){
        htmlFindings = htmlToPdfmake(report_data.findings[0].procedure_findings, { window : window });
    }
    await removeMargin(htmlFindings);

    let htmlSummary = htmlToPdfmake('<p>El informe <strong>NO posee en suma.</strong><p>', { window : window });
    if(report_data.summary !== undefined && report_data.summary !== null && report_data.summary !== ''){
        htmlSummary = htmlToPdfmake(report_data.summary, { window : window });
    }
    await removeMargin(htmlSummary);

    //Findings title:
    const findingsTitle = report_data.findings[0].title + ':';

    //Define document structure:
    const docDefinition = {
        //PAGE MARGINS:
        pageMargins: [40, 90, 40, 40],

        //HEADER:
        header: obj_logos.logoPDFContent,

        //FOOTER:
        footer: (currentPage, pageCount) => { return { table: { widths: [ "*"], body: [[ {
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
                    report_data.patient.person.documents[0].document,
                    report_data.procedure.name,
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
        images: obj_logos.logoPDFStyle,
                  
        //STYLES:
        styles: {
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

    //Return document definition:
    return docDefinition;
}
//--------------------------------------------------------------------------------------------------------------------//

//--------------------------------------------------------------------------------------------------------------------//
// REMOVE MARGIN:
//--------------------------------------------------------------------------------------------------------------------//
// Fix pdfMake does not generate line breaks between paragraphs in 'text' object field.
// Remove excesive margin between paragraphs (htmlToPdfMake).
//--------------------------------------------------------------------------------------------------------------------//
async function removeMargin(htmlToPdfmake_result){
    await Promise.all(Object.keys(htmlToPdfmake_result).map(key => {
        delete htmlToPdfmake_result[key].margin;
    }));
}
//--------------------------------------------------------------------------------------------------------------------//

//--------------------------------------------------------------------------------------------------------------------//
// SET LOGOS:
//--------------------------------------------------------------------------------------------------------------------//
async function setLogos(fk_performing){
    //Initializate logo object:
    let objLogos = {
        organizationLogo    : null,
        branchLogo       : null,
        logoEmailContent : '',
        logoPDFContent   : '',
        logoPDFStyle     : {}
    };

    //Set performing aggregate (same as find performing handler but with match _id):
    let performing_aggregate = [
        //Appointment (Lookup & Unwind):
        { $lookup: {
            from: 'appointments',
            localField: 'fk_appointment',
            foreignField: '_id',
            as: 'appointment',
        }},
        { $unwind: { path: "$appointment", preserveNullAndEmptyArrays: true } },

        //------------------------------------------------------------------------------------------------------------//
        // APPOINTMENT IMAGING:
        //------------------------------------------------------------------------------------------------------------//
        //Organizations lookup:
        { $lookup: {
            from: 'organizations',
            localField: 'appointment.imaging.organization',
            foreignField: '_id',
            as: 'appointment.imaging.organization',
        }},

        //Branches lookup:
        { $lookup: {
            from: 'branches',
            localField: 'appointment.imaging.branch',
            foreignField: '_id',
            as: 'appointment.imaging.branch',
        }},

        //Services lookup:
        { $lookup: {
            from: 'services',
            localField: 'appointment.imaging.service',
            foreignField: '_id',
            as: 'appointment.imaging.service',
        }},

        //Unwind:
        { $unwind: { path: "$appointment.imaging.organization", preserveNullAndEmptyArrays: true } },
        { $unwind: { path: "$appointment.imaging.branch", preserveNullAndEmptyArrays: true } },
        { $unwind: { path: "$appointment.imaging.service", preserveNullAndEmptyArrays: true } },
        //------------------------------------------------------------------------------------------------------------//

        //------------------------------------------------------------------------------------------------------------//
        // APPOINTMENT REFERRING:
        //------------------------------------------------------------------------------------------------------------//
        //Organizations lookup:
        { $lookup: {
            from: 'organizations',
            localField: 'appointment.referring.organization',
            foreignField: '_id',
            as: 'appointment.referring.organization',
        }},

        //Branches lookup:
        { $lookup: {
            from: 'branches',
            localField: 'appointment.referring.branch',
            foreignField: '_id',
            as: 'appointment.referring.branch',
        }},

        //Services lookup:
        { $lookup: {
            from: 'services',
            localField: 'appointment.referring.service',
            foreignField: '_id',
            as: 'appointment.referring.service',
        }},

        //Users lookup:
        { $lookup: {
            from: 'users',
            localField: 'appointment.referring.fk_referring',
            foreignField: '_id',
            as: 'appointment.referring.fk_referring',
        }},

        //Unwind:
        { $unwind: { path: "$appointment.referring.organization", preserveNullAndEmptyArrays: true } },
        { $unwind: { path: "$appointment.referring.branch", preserveNullAndEmptyArrays: true } },
        { $unwind: { path: "$appointment.referring.service", preserveNullAndEmptyArrays: true } },
        { $unwind: { path: "$appointment.referring.fk_referring", preserveNullAndEmptyArrays: true } },
        //------------------------------------------------------------------------------------------------------------//

        //------------------------------------------------------------------------------------------------------------//
        // APPOINTMENT REPORTING:
        //------------------------------------------------------------------------------------------------------------//
        //Organizations lookup:
        { $lookup: {
            from: 'organizations',
            localField: 'appointment.reporting.organization',
            foreignField: '_id',
            as: 'appointment.reporting.organization',
        }},

        //Branches lookup:
        { $lookup: {
            from: 'branches',
            localField: 'appointment.reporting.branch',
            foreignField: '_id',
            as: 'appointment.reporting.branch',
        }},

        //Services lookup:
        { $lookup: {
            from: 'services',
            localField: 'appointment.reporting.service',
            foreignField: '_id',
            as: 'appointment.reporting.service',
        }},

        //Users lookup:
        { $lookup: {
            from: 'users',
            localField: 'appointment.reporting.fk_reporting',
            foreignField: '_id',
            as: 'appointment.reporting.fk_reporting',
        }},

        //Unwind:
        { $unwind: { path: "$appointment.reporting.organization", preserveNullAndEmptyArrays: true } },
        { $unwind: { path: "$appointment.reporting.branch", preserveNullAndEmptyArrays: true } },
        { $unwind: { path: "$appointment.reporting.service", preserveNullAndEmptyArrays: true } },
        { $unwind: { path: "$appointment.reporting.fk_reporting", preserveNullAndEmptyArrays: true } },
        //------------------------------------------------------------------------------------------------------------//

        //------------------------------------------------------------------------------------------------------------//
        // APPOINTMENT PATIENT:
        //------------------------------------------------------------------------------------------------------------//
        //Patient (Lookup & Unwind):
        { $lookup: {
            from: 'users',
            localField: 'appointment.fk_patient',
            foreignField: '_id',
            as: 'patient',
        }},
        { $unwind: { path: "$patient", preserveNullAndEmptyArrays: true } },

        //Patient -> Person (Lookup & Unwind):
        { $lookup: {
            from: 'people',
            localField: 'patient.fk_person',
            foreignField: '_id',
            as: 'patient.person',
        }},
        { $unwind: { path: "$patient.person", preserveNullAndEmptyArrays: true } },
        //------------------------------------------------------------------------------------------------------------//

        //------------------------------------------------------------------------------------------------------------//
        // APPOINTMENT ATTACHED FILES:
        //------------------------------------------------------------------------------------------------------------//
        //Attached files lookup [Array]:
        { $lookup: {
            from: 'files',
            localField: 'appointment.attached_files',
            foreignField: '_id',
            as: 'appointment.attached_files'
        }},
        //------------------------------------------------------------------------------------------------------------//

        //Equipment (Lookup & Unwind):
        { $lookup: {
            from: 'equipments',
            localField: 'fk_equipment',
            foreignField: '_id',
            as: 'equipment',
        }},
        { $unwind: { path: "$equipment", preserveNullAndEmptyArrays: true } },

        //Procedure (Lookup & Unwind):
        { $lookup: {
            from: 'procedures',
            localField: 'fk_procedure',
            foreignField: '_id',
            as: 'procedure',
        }},
        { $unwind: { path: "$procedure", preserveNullAndEmptyArrays: true } },
        
        //Procedure -> Modality (Lookup & Unwind):
        { $lookup: {
            from: 'modalities',
            localField: 'procedure.fk_modality',
            foreignField: '_id',
            as: 'modality',
        }},
        { $unwind: { path: "$modality", preserveNullAndEmptyArrays: true } },

        //Injection user (Lookup & Unwind):
        { $lookup: {
            from: 'users',
            localField: 'injection.injection_user',
            foreignField: '_id',
            as: 'injection.injection_user',
        }},
        { $unwind: { path: "$injection.injection_user", preserveNullAndEmptyArrays: true } },

        //Injection technician (User) -> People (Lookup & Unwind):
        { $lookup: {
            from: 'people',
            localField: 'injection.injection_user.fk_person',
            foreignField: '_id',
            as: 'injection.injection_user.person',
        }},
        { $unwind: { path: "$injection.injection_user.person", preserveNullAndEmptyArrays: true } },

        //PET-CT Laboratory user (Lookup & Unwind):
        { $lookup: {
            from: 'users',
            localField: 'injection.pet_ct.laboratory_user',
            foreignField: '_id',
            as: 'injection.pet_ct.laboratory_user',
        }},
        { $unwind: { path: "$injection.pet_ct.laboratory_user", preserveNullAndEmptyArrays: true } },

        //PET-CT Laboratory user (User) -> People (Lookup & Unwind):
        { $lookup: {
            from: 'people',
            localField: 'injection.pet_ct.laboratory_user.fk_person',
            foreignField: '_id',
            as: 'injection.pet_ct.laboratory_user.person',
        }},
        { $unwind: { path: "$injection.pet_ct.laboratory_user.person", preserveNullAndEmptyArrays: true } },

        //Acquisition console technician Users (Lookup & Unwind):
        { $lookup: {
            from: 'users',
            localField: 'acquisition.console_technician',
            foreignField: '_id',
            as: 'acquisition.console_technician',
        }},
        { $unwind: { path: "$acquisition.console_technician", preserveNullAndEmptyArrays: true } },

        //Acquisition console technician (User) -> People (Lookup & Unwind):
        { $lookup: {
            from: 'people',
            localField: 'acquisition.console_technician.fk_person',
            foreignField: '_id',
            as: 'acquisition.console_technician.person',
        }},
        { $unwind: { path: "$acquisition.console_technician.person", preserveNullAndEmptyArrays: true } },

        //------------------------------------------------------------------------------------------------------------//
        // REMOVE DUPLICATED VALUES (SET DEFAULT PROJECTION):
        // Important note: Request project replaces the aggregation projection (This prevent mix content proj error).
        //------------------------------------------------------------------------------------------------------------//
        { $project: {
            //Self:
            'createdAt': 0,
            'updatedAt': 0,
            '__v': 0,

            //Appointment:
            'appointment.createdAt': 0,
            'appointment.updatedAt': 0,
            'appointment.__v': 0,

            //Appointment patient:
            'appointment.fk_patient': 0,
            'patient.fk_person': 0,
            'patient.password': 0,
            'patient.permissions': 0,
            'patient.settings': 0,
            'patient.createdAt': 0,
            'patient.updatedAt': 0,
            'patient.__v': 0,
            'patient.person.createdAt': 0,
            'patient.person.updatedAt': 0,
            'patient.person.__v': 0,

            //Appointment imaging:
            'appointment.imaging.organization.createdAt': 0,
            'appointment.imaging.organization.updatedAt': 0,
            'appointment.imaging.organization.__v': 0,

            'appointment.imaging.branch.createdAt': 0,
            'appointment.imaging.branch.updatedAt': 0,
            'appointment.imaging.branch.__v': 0,

            'appointment.imaging.service.createdAt': 0,
            'appointment.imaging.service.updatedAt': 0,
            'appointment.imaging.service.__v': 0,

            //Appointment referring:
            'appointment.referring.organization.createdAt': 0,
            'appointment.referring.organization.updatedAt': 0,
            'appointment.referring.organization.__v': 0,

            'appointment.referring.branch.createdAt': 0,
            'appointment.referring.branch.updatedAt': 0,
            'appointment.referring.branch.__v': 0,

            'appointment.referring.service.createdAt': 0,
            'appointment.referring.service.updatedAt': 0,
            'appointment.referring.service.__v': 0,

            'appointment.referring.fk_referring.fk_person': 0,
            'appointment.referring.fk_referring.password': 0,
            'appointment.referring.fk_referring.permissions': 0,
            'appointment.referring.fk_referring.settings': 0,
            'appointment.referring.fk_referring.createdAt': 0,
            'appointment.referring.fk_referring.updatedAt': 0,
            'appointment.referring.fk_referring.__v': 0,

            //Appointment reporting:
            'appointment.reporting.organization.createdAt': 0,
            'appointment.reporting.organization.updatedAt': 0,
            'appointment.reporting.organization.__v': 0,

            'appointment.reporting.branch.createdAt': 0,
            'appointment.reporting.branch.updatedAt': 0,
            'appointment.reporting.branch.__v': 0,

            'appointment.reporting.service.createdAt': 0,
            'appointment.reporting.service.updatedAt': 0,
            'appointment.reporting.service.__v': 0,

            'appointment.reporting.fk_reporting.fk_person': 0,
            'appointment.reporting.fk_reporting.password': 0,
            'appointment.reporting.fk_reporting.permissions': 0,
            'appointment.reporting.fk_reporting.settings': 0,
            'appointment.reporting.fk_reporting.createdAt': 0,
            'appointment.reporting.fk_reporting.updatedAt': 0,
            'appointment.reporting.fk_reporting.__v': 0,

            //Equipment:
            'equipment.createdAt': 0,
            'equipment.updatedAt': 0,
            'equipment.__v': 0,

            //Procedure:
            'procedure.createdAt': 0,
            'procedure.updatedAt': 0,
            'procedure.__v': 0,

            //Procedure Modality:
            'modality.createdAt': 0,
            'modality.updatedAt': 0,
            'modality.__v': 0,

            //Injection:
            'injection.injection_user.fk_person': 0,
            'injection.injection_user.password': 0,
            'injection.injection_user.permissions': 0,
            'injection.injection_user.settings': 0,
            'injection.injection_user.createdAt': 0,
            'injection.injection_user.updatedAt': 0,
            'injection.injection_user.__v': 0,
            'injection.injection_user.person.createdAt': 0,
            'injection.injection_user.person.updatedAt': 0,
            'injection.injection_user.person.__v': 0,

            //PET-CT Laboratory user:
            'injection.pet_ct.laboratory_user.fk_person': 0,
            'injection.pet_ct.laboratory_user.password': 0,
            'injection.pet_ct.laboratory_user.permissions': 0,
            'injection.pet_ct.laboratory_user.settings': 0,
            'injection.pet_ct.laboratory_user.createdAt': 0,
            'injection.pet_ct.laboratory_user.updatedAt': 0,
            'injection.pet_ct.laboratory_user.__v': 0,
            'injection.pet_ct.laboratory_user.person.createdAt': 0,
            'injection.pet_ct.laboratory_user.person.updatedAt': 0,
            'injection.pet_ct.laboratory_user.person.__v': 0,

            //Acquisition:
            'acquisition.console_technician.fk_person': 0,
            'acquisition.console_technician.password': 0,
            'acquisition.console_technician.permissions': 0,
            'acquisition.console_technician.settings': 0,
            'acquisition.console_technician.createdAt': 0,
            'acquisition.console_technician.updatedAt': 0,
            'acquisition.console_technician.__v': 0,
            'acquisition.console_technician.person.createdAt': 0,
            'acquisition.console_technician.person.updatedAt': 0,
            'acquisition.console_technician.person.__v': 0
        }},
        //------------------------------------------------------------------------------------------------------------//

        //Add fk_performing match condition in performing aggregate:
        { '$match' : { _id: mongoose.Types.ObjectId(fk_performing) } }
    ];

    //Find performing by _id (Aggregate):
    await performing.Model.aggregate(performing_aggregate)
    .exec()
    .then(async (performing_data) => {
        //FORMATING DATA:
        //Set header logos:
        if(performing_data[0].appointment.imaging.organization.base64_logo !== undefined && performing_data[0].appointment.imaging.organization.base64_logo !== null && performing_data[0].appointment.imaging.organization.base64_logo !== '' && regexBase64.test(performing_data[0].appointment.imaging.organization.base64_logo)){
            objLogos.organizationLogo = 'data:image/png;base64,' + performing_data[0].appointment.imaging.organization.base64_logo;
        }

        if(performing_data[0].appointment.imaging.branch.base64_logo !== undefined && performing_data[0].appointment.imaging.branch.base64_logo !== null && performing_data[0].appointment.imaging.branch.base64_logo !== '' && regexBase64.test(performing_data[0].appointment.imaging.branch.base64_logo)){
            objLogos.branchLogo = 'data:image/png;base64,' + performing_data[0].appointment.imaging.branch.base64_logo;
        }

        //Two logos (organization and branch):
        if(objLogos.organizationLogo !== null && objLogos.branchLogo !== null){
            //Set email logo content:
            objLogos.logoEmailContent = '<img src="' + objLogos.branchLogo + '" width="300" /><br/><br/>';

            //Set logo style:
            objLogos.logoPDFStyle = { 
                organizationLogo: objLogos.organizationLogo,
                branchLogo: objLogos.branchLogo
            };

            //Set logo content:
            objLogos.logoPDFContent = {
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
        } else if(objLogos.organizationLogo !== null){
            //Set email logo content:
            objLogos.logoEmailContent = '<img src="' + objLogos.organizationLogo + '" width="300" /><br/><br/>';

            //Set logo style:
            objLogos.logoPDFStyle = { organizationLogo: objLogos.organizationLogo };

            //Set logo content:
            objLogos.logoPDFContent = {
                image: 'organizationLogo',
                width: 220,
                alignment: 'center',
                margin: [0, 20, 0, 0],
                opacity: 0.8
            };

        //Branch logo only:
        } else if(objLogos.branchLogo !== null){
            //Set email logo content:
            objLogos.logoEmailContent = '<img src="' + objLogos.branchLogo + '" width="300" /><br/><br/>';

            //Set logo style:
            objLogos.logoPDFStyle = { branchLogo: objLogos.branchLogo };

            //Set logo content:
            objLogos.logoPDFContent = {
                image: 'branchLogo',
                width: 220,
                alignment: 'center',
                margin: [0, 20, 0, 0],
                opacity: 0.8
            };
        }
    })
    .catch((err) => {
        //Send error:
        mainServices.sendError(res, currentLang.db.query_error, err);
    });

    //Return logo object:
    return objLogos;
}
//--------------------------------------------------------------------------------------------------------------------//

//--------------------------------------------------------------------------------------------------------------------//
// Export service module:
//--------------------------------------------------------------------------------------------------------------------//
module.exports = {
    createBase64Report,
    getCompleteName,
    setLogos
};
//--------------------------------------------------------------------------------------------------------------------//