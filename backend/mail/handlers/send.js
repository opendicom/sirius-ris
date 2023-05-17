//--------------------------------------------------------------------------------------------------------------------//
// PATHOLOGIES SAVE HANDLER:
//--------------------------------------------------------------------------------------------------------------------//
//Import app modules:
const mainServices  = require('../../main.services');                            // Main services
const mainSettings  = mainServices.getFileSettings();                            // File settings (YAML)
const currentLang   = require('../../main.languages')(mainSettings.language);    // Language Module

//Import Mail Services:
const mailServices = require('../services');

//Set Email and Base64 Regex to validate:
const regexEmail = /.+\@.+\..+/;
const regexBase64 = /^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=|[A-Za-z0-9+/]{4})$/;

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
            
                //Send email:
                await mailServices.sendEmail(req, res, req.body.to, req.body.subject, req.body.message, attachments);
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