//--------------------------------------------------------------------------------------------------------------------//
// ROUTES:
// In this file the routes of the module are declared.
//--------------------------------------------------------------------------------------------------------------------//
//Import external modules
const express = require('express');

//Create Router.
const router = express.Router();

//Routes:
router.get('/find', (req, res) => {
    res.status(200).send({ success: true, message: 'Users find it works!' });
});

router.get('/findById', (req, res) => {
    res.status(200).send({ success: true, message: 'Users findById it works!' });
});
//--------------------------------------------------------------------------------------------------------------------//

//--------------------------------------------------------------------------------------------------------------------//
// Export module routes:
module.exports = router;
//--------------------------------------------------------------------------------------------------------------------//