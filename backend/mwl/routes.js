//--------------------------------------------------------------------------------------------------------------------//
// MWL ROUTES:
// In this file the routes of the MWL are declared.
//--------------------------------------------------------------------------------------------------------------------//
//Import external modules
const express = require('express');

//Import app modules:
const mainServices  = require('../main.services');                              // Main services
const mainSettings  = mainServices.getFileSettings();                           // File settings (YAML)
const currentLang   = require('../main.languages')(mainSettings.language);      // Language Module

//Import middlewares:
const mainMiddlewares = require('../main.middlewares');

//Import Handlers:
const tcpClientHandler = require('./handlers/tcp-client');

//Create Router.
const router = express.Router();

//Set ObjectId Regex to validate:
const regexObjectId = /^[0-9a-fA-F]{24}$/;

//Routes:
//INSERT:
router.post(
    '/insert',
    mainMiddlewares.checkJWT,
    mainMiddlewares.roleAccessBasedControl,
    async (req, res) => {
        //Check fk_appointment:
        if (req.body.fk_appointment){
            //Check _id is valid ObjectId:
            if(regexObjectId.test(req.body.fk_appointment)){
                //Send to handler:
                tcpClientHandler(req, res);
            } else {
                //Send not valid referenced object mensaje:
                res.status(405).send({ success: false, message: currentLang.db.not_valid_objectid });
            }
        } else {
            res.status(400).send({ success: false, message: currentLang.http.bad_request });
        }
    }
);
//--------------------------------------------------------------------------------------------------------------------//

//--------------------------------------------------------------------------------------------------------------------//
// Export module routes:
module.exports = router;
//--------------------------------------------------------------------------------------------------------------------//