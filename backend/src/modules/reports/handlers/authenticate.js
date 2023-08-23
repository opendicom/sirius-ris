//--------------------------------------------------------------------------------------------------------------------//
// REPORTS AUTHENTICATE HANDLER:
//--------------------------------------------------------------------------------------------------------------------//
//Import external modules:
const moment        = require('moment');

//Import app modules:
const mainServices  = require('../../../main.services');                            // Main services
const mainSettings  = mainServices.getFileSettings();                               // File settings (YAML)
const currentLang   = require('../../../main.languages')(mainSettings.language);    // Language Module

//Import Module Services:
const moduleServices = require('../../modules.services');

//Import Reports Services:
const reportServices = require('../services');

//Import Mail Services:
const mailServices = require('../../../mail/services');

//Import schemas:
const users     = require('../../users/schemas');

module.exports = async (req, res, currentSchema) => {
    //Get authenticated user information (Decoded JWT):
    const userAuth = {
        _id: req.decoded.sub,
        domain: req.decoded.session.domain,
        role: req.decoded.session.role,
        concession: req.decoded.session.concession
    };

    //Check that the user has entered their password:
    if(req.body.password !== undefined && req.body.password !== null && req.body.password !== ''){
        //Find authenticated user information:
        await users.Model.findById(userAuth._id, { 'password' : 1, status: 1, fk_person: 1 })
        .exec()
        .then(async (userData) => {
            //Check if user exist:
            if(userData){
                //Convert Mongoose object to Javascript object:
                userData = userData.toObject();

                //Check user status:
                if(userData.status == true){
                    //Check user password:
                    mainServices.verifyPass(userData.password, req.body.password)
                    .then(async (same) => {
                        //If Passwords match:
                        if(same){

                            //Check if the user role is 1-Superusuario OR if the user has a concession 8-Autenticar informes:
                            if(userAuth.role == 1 || userAuth.concession.includes(8)){
                                //Find referenced report:
                                await currentSchema.Model.findById(req.body._id)
                                .exec()
                                .then(async (reportData) => {
                                    //Check if have results:
                                    if(reportData){
                                        //Set logos:
                                        const objLogos = await reportServices.setLogos(reportData.fk_performing);

                                        //Check medical signatures:
                                        if(reportData.medical_signatures.length > 0){

                                            //Create handler object (sign_report):
                                            const handlerObj = {
                                                fk_performing   : reportData.fk_performing,
                                                error_message   : currentLang.ris.report_auth_error
                                            };

                                            //Check and update performing flow_state to 'P09 - Terminado (con informe)':
                                            const result = await moduleServices.reportsSaveController('authenticate_report', handlerObj);

                                            //Check result:
                                            if(result.success){
                                                //Set authenticated datetime:
                                                const auth_datetime = moment().format('YYYY-MM-DDTHH:mm:ss.SSS', { trim: false }) + 'Z';

                                                //Create report PDF on Base64:
                                                const reportResult = await reportServices.createBase64Report(req, res, userData.fk_person, auth_datetime, objLogos);
                                                
                                                //Check base64 result:
                                                if(reportResult.base64 !== false){
                                                    //Update report (add authenticate object):
                                                    const updateData = { $set: {
                                                        'authenticated': {
                                                            datetime: auth_datetime,
                                                            fk_user: userAuth._id,
                                                            base64_report: reportResult.base64
                                                        }
                                                    }};                                                    

                                                    //Update medical signatures in report:
                                                    await currentSchema.Model.findOneAndUpdate({ _id: reportData._id }, updateData, { new: true })
                                                    .then(async (updatedData) => {
                                                        
                                                        //Get patient complete name:
                                                        let patient_complete_name = reportServices.getCompleteName(reportResult.report_complete_data.patient.person);
                                                        patient_complete_name = patient_complete_name.names + ' ' + patient_complete_name.surnames;

                                                        //Datetime:
                                                        const datetime = mainServices.datetimeFulCalendarFormater(new Date(reportResult.report_complete_data.performing.date), new Date(reportResult.report_complete_data.performing.date));

                                                        //Build mail body (message):
                                                        const body_message = objLogos.logoEmailContent + 
                                                        '<p>' + 
                                                            '<strong>Estimado/a ' + patient_complete_name + ',</strong><br/>' +
                                                            '<br/>Le enviamos <strong>adjunto</strong> a este correo electrónico el <strong>informé médico</strong> del estudio realizado sobre la fecha <strong>' + datetime.dateDay + '/' + datetime.dateMonth + '/' + datetime.dateYear + '</strong>.<br/>' + 
                                                            '<br/>' + 
                                                            '<small><i>Este es un correo automático, por favor no responda a esta dirección.</i></small>' + 
                                                            '<br/><br/>' + 
                                                        '</p>';

                                                        //Set attached files:
                                                        //Encoded report string as an attachment:
                                                        attachments = [{
                                                            filename: 'Informe_medico.pdf',
                                                            content: reportResult.base64,
                                                            encoding: 'base64'
                                                        }];

                                                        //Set log_element:
                                                        const log_element = {
                                                            _id     : reportData._id,
                                                            type    : 'reports'
                                                        }

                                                        //Send authenticated report by email:
                                                        await mailServices.sendEmail(
                                                            req, res,
                                                            log_element,
                                                            reportResult.report_complete_data.patient.email,
                                                            reportResult.report_complete_data.appointment.imaging.organization.name + ' - Informe médico (Sirius RIS)',
                                                            body_message,
                                                            attachments,
                                                            false
                                                        );
                                                        
                                                        //Set log element:
                                                        const element = {
                                                            type    : currentSchema.Model.modelName,
                                                            _id     : updatedData._id
                                                        };

                                                        //Save registry in Log DB:
                                                        const logResult = await moduleServices.insertLog(req, res, 6, element);

                                                        //Check log registry result:
                                                        if(logResult){
                                                            //Send successfully response:
                                                            res.status(200).send({
                                                                success: true, 
                                                                data: updatedData,
                                                                message: currentLang.ris.report_authenticated
                                                            });
                                                        } else {
                                                            //Send log error response:
                                                            res.status(500).send({ success: false, message: currentLang.db.insert_error_log });
                                                        }                                            
                                                    })
                                                    .catch((err) => {
                                                        //Send ERROR Message:
                                                        mainServices.sendConsoleMessage('ERROR', '\nupdate [authenticate report]: Failed, ' + JSON.stringify({ report_id: reportData._id }), err);
                                                    });
                                                } else {
                                                    //Send error message:
                                                    res.status(500).send({ success: false, message: currentLang.ris.report_create_error });
                                                }
                                            } else {
                                                //Send error message:
                                                res.status(422).send({ success: false, message: result.message });
                                            }
                                        } else {
                                            //Send signatures error:
                                            res.status(422).send({ success: false, message: currentLang.ris.report_without_signatures });
                                        }
                                    } else {
                                        //No data (empty result):
                                        result = { success: false, message: currentLang.ris.wrong_report_id };
                                    }
                                })
                                .catch((err) => {
                                    //Query db error:
                                    result = { success: false, message: currentLang.db.query_error + ' - ' + err};
                                });

                            } else {
                                //Send response:
                                return res.status(401).send({ success: false, message: currentLang.rabc.not_have_method_permissions });
                            }

                        } else {
                            //Passwords don't match:
                            res.status(200).send({ success: false, message: currentLang.auth.password_dont_match });
                        }
                    })
                    .catch((err) => {
                        //Send error:
                        mainServices.sendError(res, currentLang.auth.password_error, err);
                    });

                } else {
                    res.status(200).send({ success: false, message: currentLang.auth.user_disabled });
                }
            } else {
                //Return result NO data (HTML Response):
                res.status(200).send({ success: false, message: currentLang.auth.wrong_user });
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