//--------------------------------------------------------------------------------------------------------------------//
// MAIL SERVICES:
//--------------------------------------------------------------------------------------------------------------------//
//Import external modules:
const nodemailer    = require("nodemailer");

//Import app modules:
const mainServices  = require('../main.services');                          // Main services
const mainSettings  = mainServices.getFileSettings();                       // File settings (YAML)
const currentLang   = require('../main.languages')(mainSettings.language);  // Language Module

//--------------------------------------------------------------------------------------------------------------------//
// SEND EMAIL:
//--------------------------------------------------------------------------------------------------------------------//
async function sendEmail(req, res, to, subject, body, attachments = undefined, sendResponse = true){
    // Format from value:
    from = '"' + mainSettings.mailserver.from + '" <' + mainSettings.mailserver.user + '>';

    // Initializate transporter options:
    let transporterOptions = {    
        host: mainSettings.mailserver.host,
        port: mainSettings.mailserver.port,
        secure: mainSettings.mailserver.secure,
        auth: {
            user: mainSettings.mailserver.user,
            pass: mainSettings.mailserver.pass,
        },
        tls: {
            rejectUnauthorized: false
        }
    };

    // Check if service type is Gmail (2 step verification needed):
    if(mainSettings.mailserver.type == 'gmail'){
        transporterOptions['service'] = mainSettings.mailserver.type;
    }

    // Create reusable transporter object using the default SMTP transport:
    let transporter = nodemailer.createTransport(transporterOptions);

    // Set mail options:
    const mailOptions = {
        from    : from,         // Sender address
        to      : to,           // List of receivers
        subject : subject,      // Subject line
        html    : body,         // HTML body
    };

    // Check attachments:
    if(attachments != currentLang.ris.mail_wrong_file && attachments !== undefined){
        mailOptions['attachments'] = attachments;
    }

    // Send mail with defined transport object:
    await transporter.sendMail(mailOptions,(error, info) => {
        //Check errors:
        if(error) {
            //Return error message (HTML Response):
            res.status(500).send({ success: false, message: currentLang.ris.mail_send_error, error: error });

            // Send console error:
            mainServices.sendConsoleMessage('ERROR', currentLang.ris.mail_send_error, error);
        } else {
            if(sendResponse){
                //Send successfully response:
                res.status(200).send({ success: true, message: currentLang.ris.mail_send_success, attachments: attachments });
            }
            
            // Send console information:
            mainServices.sendConsoleMessage('INFO', currentLang.ris.mail_send_success + " message_id: " + info.messageId);
        }
    });
}
//--------------------------------------------------------------------------------------------------------------------//

//--------------------------------------------------------------------------------------------------------------------//
// Export service module:
//--------------------------------------------------------------------------------------------------------------------//
module.exports = {
    sendEmail
};
//--------------------------------------------------------------------------------------------------------------------//