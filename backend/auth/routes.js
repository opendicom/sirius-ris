//--------------------------------------------------------------------------------------------------------------------//
// ROUTES:
// In this file the routes of the module are declared.
//--------------------------------------------------------------------------------------------------------------------//
//Import external modules:
const express   = require('express');

//Import middlewares:
const mainMiddlewares = require('../main.middlewares');
const authMiddlewares = require('./middlewares');

//Import Handlers:
const singinHuman       = require('./handlers/singin.human');
const singinMachine     = require('./handlers/singin.machine');
const autorizeHandler   = require('./handlers/autorize');

//Create Router.
const router = express.Router();

//Routes:
router.post(
    '/',
    authMiddlewares.accessControl, (req, res) => {
        // Human singin:
        if(req.body.documents){
            singinHuman(req, res);
        // Machine singin:
        } else if (req.body.username){
            singinMachine(req, res);
        } else {
            res.status(400).send({ success: false, message: 'Bad request.' });
        }
        
    }
);

router.post(
    '/autorize',
    mainMiddlewares.checkJWT,
    (req, res) => { autorizeHandler(req, res); }
);
//--------------------------------------------------------------------------------------------------------------------//

//--------------------------------------------------------------------------------------------------------------------//
// Export module routes:
module.exports = router;
//--------------------------------------------------------------------------------------------------------------------//