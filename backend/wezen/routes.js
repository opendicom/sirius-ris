//--------------------------------------------------------------------------------------------------------------------//
// WEZEN ROUTES:
// In this file the routes of the wezen service are declared.
//--------------------------------------------------------------------------------------------------------------------//
//Import external modules
const express   = require('express');
const mongoose  = require('mongoose');

//Import app modules:
const mainServices  = require('../main.services');                           // Main services
const mainSettings  = mainServices.getFileSettings();                           // File settings (YAML)
const currentLang   = require('../main.languages')(mainSettings.language);   // Language Module

//Import middlewares:
const mainMiddlewares = require('../main.middlewares');

//Import Module Services:
const moduleServices = require('../modules/modules.services');

//Import schemas:
const performing = require('../modules/performing/schemas');

//Create Router.
const router = express.Router();

//Set regexObjectId to validate:
const regexObjectId = /^[0-9a-fA-F]{24}$/;

//Routes:
//STUDIES:
router.get(
    '/studies',
    mainMiddlewares.checkJWT,
    mainMiddlewares.roleAccessBasedControl,     //Without exporter addDomain case (Force filters in handler with JWT data).
    async (req, res) => {
        if(req.query.fk_performing !== undefined && req.query.fk_performing !== null && req.query.fk_performing !== '' && regexObjectId.test(req.query.fk_performing)){
            /*
            //Set performing aggregate (same as find performing handler but with match _id):
            const aggregate = [
                //...//
                //Add performing _id match condition in performing aggregate:
                { '$match' : { _id: mongoose.Types.ObjectId(req.body.fk_performing) } }
            ];

            //Check performing:
            await performing.Model.aggregate(aggregate)
            .exec()
            .then((performingData) => {

                //----------------//
                // Study IUID ??? //
                //----------------//

                //Send request to wezen service:
                mainServices.httpClientRequest(mainSettings.wezen.host, mainSettings.wezen.port, 'GET', '', undefined, (wezenData) => {
                    //Check response data:
                    console.log('\n[ TEST ]:');
                    console.log(wezenData);
                });
            })
            .catch((err) => {
                //Send error:
                mainServices.sendError(res, currentLang.db.query_error, err);
            });
            */

            //Test:
            res.status(200).send({ wezen : true });
        } else {
            //Bad request:
            res.status(400).send({ success: false, message: currentLang.http.bad_request });
        }
    }
);
//--------------------------------------------------------------------------------------------------------------------//

//--------------------------------------------------------------------------------------------------------------------//
// Export module routes:
module.exports = router;
//--------------------------------------------------------------------------------------------------------------------//