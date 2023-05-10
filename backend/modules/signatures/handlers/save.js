//--------------------------------------------------------------------------------------------------------------------//
// SIGNATURES SAVE HANDLER:
//--------------------------------------------------------------------------------------------------------------------//
//Import app modules:
const mainServices  = require('../../../main.services');                            // Main services
const mainSettings  = mainServices.getFileSettings();                               // File settings (YAML)
const currentLang   = require('../../../main.languages')(mainSettings.language);    // Language Module

//Import Module Services:
const moduleServices = require('../../modules.services');

//Import schemas:
const users = require('../../users/schemas');

module.exports = async (req, res, currentSchema, operation) => {
    //Set referenced elements (FKs - Check existence):
    let referencedElements = [];
    referencedElements.push([ req.body.fk_report, 'reports' ]);

    //Get authenticated user information (Decoded JWT):
    const userAuth = {
        _id: req.decoded.sub,
        domain: req.decoded.session.domain,
        role: req.decoded.session.role,
        concession: req.decoded.session.concession
    };

    //What the domain corresponds to:
    const domainType = await moduleServices.domainIs(userAuth.domain, res);

    //Set complete domain:
    const completeDomain = await moduleServices.getCompleteDomain(userAuth.domain, domainType);

    //Check that the user has entered their password:
    if(req.body.password !== undefined && req.body.password !== null && req.body.password !== ''){
        //Find authenticated user information:
        await users.Model.findById(userAuth._id, { 'password' : 1, status: 1 })
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

                            //Check if the user role is 1-Superusuario, 3-Supervisor or 4-Médico OR if the user has a concession 7-Firmar informes:
                            if(userAuth.role == 1 || userAuth.role == 3 || userAuth.role == 4 || userAuth.concession.includes(7)){
                                
                                //Generate SHA2 from the report:
                                const sha2_result = await moduleServices.setSHA2Report(req.body.fk_report);

                                if(sha2_result.success){
                                    //Check SHA2 of report in case it contains medical_signatures:
                                    let secure_sign = {};
                                    if(sha2_result.report_data.medical_signatures.length > 0){
                                        secure_sign = await moduleServices.checkSHA2Report(sha2_result.sha2, sha2_result.report_data.medical_signatures);
                                    } else {
                                        //If no signatures set to 'safe to sign':
                                        secure_sign = { success: true };
                                    }

                                    //Check if is safe to sign:
                                    if(secure_sign.success){
                                        //Search for duplicates:
                                        duplicated = await moduleServices.checkSignature(res, req.body.fk_report, userAuth._id);

                                        //Check for duplicates:
                                        if(duplicated == false){
                                            //Add fK_organization into the request:
                                            req.body['fk_organization'] = completeDomain.organization;
                                            
                                            //Add fk_user into the request:
                                            req.body['fk_user'] = userAuth._id;

                                            //Add generated SHA-2 into the request:
                                            req.body['sha2'] = sha2_result.sha2;

                                            //Excecute main query:
                                            switch(operation){
                                                case 'insert':
                                                    //Create handler object (sign_report):
                                                    const handlerObj = {
                                                        fk_performing: sha2_result.report_data.fk_performing,
                                                        error_message: currentLang.ris.wrong_report_flow_state
                                                    };

                                                    //Check and update performing flow_state to 'P08 - Informe firmado':
                                                    const result = await moduleServices.reportsSaveController('sign_report', handlerObj);

                                                    //Check result:
                                                    if(result.success){
                                                        //Save signature data:
                                                        await moduleServices.insert(req, res, currentSchema, referencedElements, true, async (savedData) => {
                                                            //Check saved data:
                                                            if(savedData){
                                                                //Add sign to report:
                                                                await moduleServices.addSignatureToReport(sha2_result.report_data, savedData._id, req, res);
                                                            }
                                                        });
                                                    } else {
                                                        //Send error message:
                                                        res.status(422).send({ success: false, message: result.message });
                                                    }
                                                    break;
                                                default:
                                                    res.status(500).send({ success: false, message: currentLang.db.not_allowed_save });
                                                    break;
                                            }
                                        }
                                    } else {
                                        //Send error message:
                                        res.status(422).send({ success: false, message: secure_sign.message });
                                    }
                                } else {
                                    //Send error message:
                                    res.status(422).send({ success: false, message: sha2_result.message });
                                }                
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