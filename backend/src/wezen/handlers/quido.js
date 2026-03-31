//--------------------------------------------------------------------------------------------------------------------//
// QUIDO FROM WEZEN HANDLER:
//--------------------------------------------------------------------------------------------------------------------//
//Import external modules:
const jwt = require('jsonwebtoken');

//Import app modules:
const mainServices  = require('../../main.services');                            // Main services
const mainSettings  = mainServices.getFileSettings();                            // File settings (YAML)
const currentLang   = require('../../main.languages')(mainSettings.language);    // Language Module

module.exports = async (req, res) => {
    //Get request query parameters:
    const StudyDate                 = req.query.StudyDate;
    const StudyTime                 = req.query.StudyTime;
    const AccessionNumber           = req.query.AccessionNumber;
    const ModalitiesInStudy         = req.query.ModalitiesInStudy;
    const ReferringPhysicianName    = req.query.ReferringPhysicianName;
    const PatientID                 = req.query.PatientID;
    const PatientName               = req.query.PatientName;
    const StudyInstanceUID          = req.query.StudyInstanceUID;
    const StudyID                   = req.query.StudyID;

    //Get authenticated user information (Decoded JWT):
    const userAuth = {
        _id: req.decoded.sub,
        domain: req.decoded.session.domain,
        role: req.decoded.session.role,
        concession: req.decoded.session.concession
    };

    //Set token time expiration (5 minutes):
    const first_time_exp = '5m';

    //Create payload:
    const payload = {
        sub: userAuth._id.toString(),          //Identify the subject of the token.
        iat: (Date.now() / 1000),              //Token creation date.
        //exp: (Declared in expiresIn)         //Token expiration date.
        aud: 'sirius-hip'
    };
    
    //Create JWT for Wezen > Quido (Sirius Proxy):
    jwt.sign(payload, mainSettings.AUTH_JWT_SECRET, { expiresIn: first_time_exp }, async (err, token) => {
        if(err){
            res.status(500).send({ success: false, message: 'wezen - quido | ' + currentLang.jwt.sign_error, error: err });
    
            //Send error:
            mainServices.sendError(res, 'wezen - quido | ' + currentLang.jwt.sign_error, err);
    
            return;
        }

        // Set QUIDO path:
        const quidoPath = 'http://' + mainSettings.wezen.host + ':' + mainSettings.wezen.port + '/qido/studies';
        
        //Set headers:
        const options = {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        };

        //Send HTTP Request:
        await mainServices.httpClientGETRequest(quidoPath, options, async (wezenResponse) => {
            //Test:
            console.log(wezenResponse);
        });
    });
}
//--------------------------------------------------------------------------------------------------------------------//