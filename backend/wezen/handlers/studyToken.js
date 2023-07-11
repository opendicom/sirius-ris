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
    if(req.query.fk_performing !== undefined && req.query.fk_performing !== null && req.query.fk_performing !== '' && regexObjectId.test(req.query.fk_performing)){
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

            //Injection technician (User) -> People (Lookup & Unwind):
            { $lookup: {
                from: 'people',
                localField: 'injection.injection_user.fk_person',
                foreignField: '_id',
                as: 'injection.injection_user.person',
            }},
            { $unwind: { path: "$injection.injection_user.person", preserveNullAndEmptyArrays: true } },

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
        .then((performingData) => {
            //Set token time expiration (5 minutes):
            const first_time_exp = '5m';

            //Create payload:
            const payload = {
                sub: userAuth._id.toString(),          //Identify the subject of the token.
                iat: (Date.now() / 1000),              //Token creation date.
                //exp: (Declared in expiresIn)         //Token expiration date.
            }

            //Create JWT for Wezen > Wado (Sirius Proxy):
            jwt.sign(payload, mainSettings.AUTH_JWT_SECRET, { expiresIn: first_time_exp }, async (err, token) => {
                if(err){
                    res.status(500).send({ success: false, message: 'wezen - ' + currentLang.jwt.sign_error, error: err });

                    //Send error:
                    mainServices.sendError(res, 'wezen - ' + currentLang.jwt.sign_error, err);

                    return;
                }


                //Send request to wezen service:
                /*
                mainServices.httpClientRequest(mainSettings.wezen.host, mainSettings.wezen.port, 'GET', '/studyToken?token=blabla', undefined, (wezenData) => {
                    //Check response data:
                    console.log('\n[ TEST ]:');
                    console.log(wezenData);
                });
                */

                //Test:
                res.status(200).send({ token : token, performing: performingData });
            });
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