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
const singinHandler     = require('./handlers/singin');
const autorizeHandler   = require('./handlers/autorize');

//Create Router.
const router = express.Router();

//Routes:
router.post(
    '/',
    authMiddlewares.accessControl,
    (req, res) => { singinHandler(req, res); }
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