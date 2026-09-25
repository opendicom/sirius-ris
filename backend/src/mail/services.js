//--------------------------------------------------------------------------------------------------------------------//
// MAIL SERVICES:
//--------------------------------------------------------------------------------------------------------------------//
//Import external modules:
const nodemailer    = require("nodemailer");

//Import app modules:
const mainServices  = require('../main.services');                          // Main services
const mainSettings  = mainServices.getFileSettings();                       // File settings (YAML)
const currentLang   = require('../main.languages')(mainSettings.language);  // Language Module

//Import module services:
const moduleServices = require('../modules/modules.services');

//Import schemas:
const organizations = require('../modules/organizations/schemas');

//--------------------------------------------------------------------------------------------------------------------//
// SEND EMAIL:
//--------------------------------------------------------------------------------------------------------------------//
async function sendEmail(req, res, log_element, to, subject, body, attachments = undefined, sendResponse = true, email_alt = undefined){
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

    //Find the requesting organization's own mail configuration (no shared/fixed credentials):
    await organizations.Model.findById(completeDomain.organization, { mail_options: 1 })
    .exec()
    .then(async (data) => {
        //Check organization email params:
        if(data && data.mail_options !== undefined && data.mail_options.host !== undefined && data.mail_options.host !== null && data.mail_options.host !== '' &&
           data.mail_options.user !== undefined && data.mail_options.user !== null && data.mail_options.user !== '' &&
           data.mail_options.pass !== undefined && data.mail_options.pass !== null && data.mail_options.pass !== ''){

            // Format from value:
            const from = '"' + data.mail_options.from + '" <' + data.mail_options.user + '>';

            // Initializate transporter options:
            let transporterOptions = {
                host: data.mail_options.host,
                port: data.mail_options.port,
                secure: data.mail_options.secure,
                auth: {
                    user: data.mail_options.user,
                    pass: data.mail_options.pass,
                }
            };

            // Check if service type is Gmail (2 step verification needed):
            if(data.mail_options.type == 'gmail'){
                transporterOptions['service'] = data.mail_options.type;
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

            // Check alternative email (optional, sent as cc):
            if(email_alt !== undefined && email_alt !== null && email_alt !== ''){
                mailOptions['cc'] = email_alt;
            }

            // Check attachments:
            if(attachments != currentLang.ris.mail_wrong_file && attachments !== undefined){
                mailOptions['attachments'] = attachments;
            }

            // Send mail with defined transport object:
            await transporter.sendMail(mailOptions, async (error, info) => {
                //Check errors:
                if(error) {
                    //Return error message (HTML Response):
                    res.status(500).send({ success: false, message: currentLang.ris.mail_send_error, error: error });

                    // Send console error:
                    mainServices.sendConsoleMessage('ERROR', currentLang.ris.mail_send_error, error);
                } else {
                    //Add details in element log entry (mail address to / cc):
                    log_element['details'] = mailOptions['cc'] !== undefined ? to + ' (cc: ' + mailOptions['cc'] + ')' : to;

                    //Save registry in Log DB:
                    const logResult = await moduleServices.insertLog(req, res, 7, log_element);

                    if(sendResponse && logResult){
                        //Send successfully response:
                        res.status(200).send({ success: true, message: currentLang.ris.mail_send_success, attachments: attachments });
                    }

                    // Send console information:
                    mainServices.sendConsoleMessage('INFO', currentLang.ris.mail_send_success + " message_id: " + info.messageId);
                }
            });
        } else {
            //Return error message (HTML Response):
            res.status(422).send({ success: false, message: currentLang.ris.mail_send_error + ' | ' + currentLang.ris.mail_not_configured });
        }
    })
    .catch((err) => {
        //Send error:
        mainServices.sendError(res, currentLang.db.query_error, err);
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