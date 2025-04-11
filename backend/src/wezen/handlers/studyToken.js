//--------------------------------------------------------------------------------------------------------------------//
// STUDY TOKEN FROM WEZEN HANDLER:
//--------------------------------------------------------------------------------------------------------------------//
//Import external modules:
const jwt       = require('jsonwebtoken');
const mongoose  = require('mongoose');

//Import app modules:
const mainServices  = require('../../main.services');                            // Main services
const mainSettings  = mainServices.getFileSettings();                            // File settings (YAML)
const currentLang   = require('../../main.languages')(mainSettings.language);    // Language Module

//Import schemas:
const performing = require('../../modules/performing/schemas');

//Set regexObjectId to validate:
const regexObjectId = /^[0-9a-fA-F]{24}$/;

module.exports = async (req, res) => {
    //Get authenticated user information (Decoded JWT):
    const userAuth = {
        _id: req.decoded.sub,
        domain: req.decoded.session.domain,
        role: req.decoded.session.role,
        concession: req.decoded.session.concession
    };

    //Check request fields:
    if(req.query.fk_performing !== undefined && req.query.fk_performing !== null && req.query.fk_performing !== '' && regexObjectId.test(req.query.fk_performing) && req.query.accessType !== undefined && req.query.accessType !== null && req.query.accessType !== ''){
        //Set performing aggregate (same as find performing handler but with match _id and custom project):
        const aggregate = [
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

            //Injection user (User) -> People (Lookup & Unwind):
            { $lookup: {
                from: 'people',
                localField: 'injection.injection_user.fk_person',
                foreignField: '_id',
                as: 'injection.injection_user.person',
            }},
            { $unwind: { path: "$injection.injection_user.person", preserveNullAndEmptyArrays: true } },

            //PET-CT | Laboratory user (Lookup & Unwind):
            { $lookup: {
                from: 'users',
                localField: 'injection.pet_ct.laboratory_user',
                foreignField: '_id',
                as: 'injection.pet_ct.laboratory_user',
            }},
            { $unwind: { path: "$injection.pet_ct.laboratory_user", preserveNullAndEmptyArrays: true } },

            //PET-CT | Laboratory user (User) -> People (Lookup & Unwind):
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
                //Custom project:
                'appointment.study_iuid' : 1
            }},
            
            //Add performing _id match condition in performing aggregate:
            { '$match' : { _id: mongoose.Types.ObjectId(req.query.fk_performing) } }
        ];

        //Send DEBUG Message:
        mainServices.sendConsoleMessage('DEBUG', '\nwezen find aggregation [processed condition]: ' + JSON.stringify(aggregate));

        //Check performing:
        await performing.Model.aggregate(aggregate)
        .exec()
        .then(async (performingData) => {
            //Check if have results:
            if(performingData){
                //Set token time expiration (5 minutes):
                const first_time_exp = '5m';

                //Create payload:
                const payload = {
                    sub: userAuth._id.toString(),          //Identify the subject of the token.
                    iat: (Date.now() / 1000),              //Token creation date.
                    //exp: (Declared in expiresIn)         //Token expiration date.
                    aud: 'wezen'
                }

                //Create JWT for Wezen > Wado (Sirius Proxy):
                jwt.sign(payload, mainSettings.AUTH_JWT_SECRET, { expiresIn: first_time_exp }, async (err, token) => {
                    if(err){
                        res.status(500).send({ success: false, message: 'wezen - studyToken | ' + currentLang.jwt.sign_error, error: err });

                        //Send error:
                        mainServices.sendError(res, 'wezen - studyToken | ' + currentLang.jwt.sign_error, err);

                        return;
                    }

                    // Check that the Study IUID has at least one instance in the PACS (Study):
                    // It is checked with the path studyToken, accessType=weasis and max=1.
                    // accessType=weasis : because it is the cheapest manifest to generate.
                    // max=1 : to stop at the first instance found.
                    const checkPath = 'http://' + mainSettings.wezen.host + ':' + mainSettings.wezen.port + '/studyToken?accessType=weasis.xml&token=' + token + '&StudyInstanceUID=' + performingData[0].appointment.study_iuid + '&max=1';
                    
                    //Send Check HTTP Request:
                    await mainServices.httpClientGETRequest(checkPath, async (wezenResponse) => {
                        //Parse XML String response to JSON:
                        await mainServices.XMLStringToJSON(wezenResponse, (objResponse) => {

                            //Check if exist Patient property in current response object (Has studies or not):
                            if(objResponse.hasOwnProperty('manifest') && objResponse.manifest.hasOwnProperty('arcQuery') && objResponse.manifest.arcQuery[0].hasOwnProperty('Patient')){
                                //Initializate wezen path:
                                let wezenPath = '';
                                
                                //Check and set accessType:
                                switch(req.query.accessType){
                                    case 'ohif':
                                        //Set viewer external path (ip_server):
                                        wezenPath = 'http://' + mainSettings.ip_server + ':' + mainSettings.sirius_frontend.port + '/dcm-viewer/viewer/dicomjson?url=http%3A%2F%2F' + mainSettings.ip_server + '%3A' + mainSettings.wezen.port + '%2FstudyToken%3FaccessType%3Dohif%26token%3D' + token + '%26StudyInstanceUID%3D' + performingData[0].appointment.study_iuid;
                                        break;

                                    case 'weasis':
                                        //Set weasis manifiest path (ip_server):
                                        wezenPath = 'http://' + mainSettings.ip_server + ':' + mainSettings.wezen.port + '/studyToken?accessType=weasis.xml&token=' + token + '&StudyInstanceUID=' + performingData[0].appointment.study_iuid + '&proxyURI=http://' + mainSettings.ip_server + ':' + mainSettings.wezen.port + '/wado';
                                        break;
                                    
                                    case 'dicom.zip':
                                        //Set DICOM download external path (ip_server):
                                        wezenPath = 'http://' + mainSettings.ip_server + ':' + mainSettings.wezen.port + '/studyToken?accessType=dicom.zip&token=' + token + '&StudyInstanceUID=' + performingData[0].appointment.study_iuid;
                                        break;
                                }
                                
                                //Send successfully response:
                                res.status(200).send({ success : true, path: wezenPath });
                            } else {
                                //No data on PACS (empty result on PACS):
                                res.status(200).send({ success: false, message: 'wezen | pacs: ' + currentLang.db.query_no_data });
                            } 
                        });
                    });
                });
            } else {
                //No data (empty result):
                res.status(200).send({ success: false, message: 'wezen: ' + currentLang.db.query_no_data });
            }
        })
        .catch((err) => {
            //Send error:
            mainServices.sendError(res, currentLang.db.query_error, err);
        });
    } else {
        //Bad request:
        res.status(400).send({ success: false, message: currentLang.http.bad_request });
    }
}
//--------------------------------------------------------------------------------------------------------------------//