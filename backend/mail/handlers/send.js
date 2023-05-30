//--------------------------------------------------------------------------------------------------------------------//
// SEND MAIL HANDLER:
//--------------------------------------------------------------------------------------------------------------------//
//Import app modules:
const mainServices  = require('../../main.services');                            // Main services
const mainSettings  = mainServices.getFileSettings();                            // File settings (YAML)
const currentLang   = require('../../main.languages')(mainSettings.language);    // Language Module

//Import Mail Services:
const mailServices = require('../services');

//Set Email, Base64 and ObjectId Regex to validate:
const regexEmail = /.+\@.+\..+/;
const regexBase64 = /^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=|[A-Za-z0-9+/]{4})$/;
const regexObjectId = /^[0-9a-fA-F]{24}$/;

module.exports = async (req, res) => {
    //Initializate attachments:
    let attachments = undefined;
    
    //Check email:
    if(regexEmail.test(req.body.to)){
        //Validate subject is not empty:
        if(req.body.subject !== undefined && req.body.subject !== null && req.body.subject !== ''){
            //Validate message is not empty:
            if(req.body.message !== undefined && req.body.message !== null && req.body.message !== ''){

                //Check base64 (optional):
                if(req.body.base64){
                    //Validate base64 and filename:
                    if(regexBase64.test(req.body.base64) && req.body.filename !== undefined && req.body.filename !== null && req.body.filename !== ''){
                        //Encoded string as an attachment:
                        attachments = [{
                            filename: req.body.filename,
                            content: req.body.base64,
                            encoding: 'base64'
                        }];
                    } else {
                        //Set attached flag:
                        attachments = currentLang.ris.mail_wrong_file;
                    }
                }

                if(req.body.element_id !== undefined && req.body.element_id !== null && req.body.element_id !== '' && req.body.element_type !== undefined && req.body.element_type !== null && req.body.element_type !== ''){
                    //Check log element _id:
                    if(regexObjectId.test(req.body.element_id)){
                        //Set log_element:
                        const log_element = {
                            _id     : req.body.element_id,
                            type    : req.body.element_type
                        }

                        //Send email:
                        await mailServices.sendEmail(req, res, log_element, req.body.to, req.body.subject, req.body.message, attachments);
                    } else {
                        //Return the result (HTML Response):
                        res.status(422).send({ success: false, message: currentLang.db.not_valid_objectid });    
                    }
                } else {
                    //Return the result (HTML Response):
                    res.status(422).send({ success: false, message: currentLang.ris.missing_information_log });
                }
            } else {
                //Return the result (HTML Response):
                res.status(422).send({ success: false, message: currentLang.ris.mail_empty_message });
            }
        } else {
            //Return the result (HTML Response):
            res.status(422).send({ success: false, message: currentLang.ris.mail_empty_subject });
        }
    } else {
        //Return the result (HTML Response):
        res.status(422).send({ success: false, message: currentLang.ris.mail_wrong_address });
    }
}
//--------------------------------------------------------------------------------------------------------------------//