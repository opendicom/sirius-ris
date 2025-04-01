//--------------------------------------------------------------------------------------------------------------------//
// DOWNLOADS ROUTES:
//--------------------------------------------------------------------------------------------------------------------//
//Import external modules
const express   = require('express');

//Import app modules:
const mainServices  = require('../main.services');                           // Main services
const mainSettings  = mainServices.getFileSettings();                        // File settings (YAML)
const currentLang   = require('../main.languages')(mainSettings.language);   // Language Module

//Create Router.
const router = express.Router();

//Routes:
//WEASIS:
router.get('/weasis', (req, res) => {
    //Check selected platform:
    if(req.query.platform !== undefined && req.query.platform !== null && req.query.platform !== ''){
        //Set current path:
        let file = `${__dirname}`;

        //Switch by platform:
        switch(req.query.platform){
            case 'windows':
                file += '/weasis/weasis-4.0.3-windows.msi';
                break;
            case 'macos':
                file += '/weasis/weasis-4.0.3-macos.pkg';
                break;
            case 'linux.deb':
                file += '/weasis/weasis-4.0.3-linux.deb';
                break;
            case 'linux.rpm':
                file += '/weasis/weasis-4.0.3-linux.rpm';
                break;
        }

        //Download selected file:
        res.download(file);
    } else {
        //Bad request:
        res.status(400).send({ success: false, message: currentLang.http.bad_request });
    }  
});
//--------------------------------------------------------------------------------------------------------------------//

//--------------------------------------------------------------------------------------------------------------------//
// Export module routes:
module.exports = router;
//--------------------------------------------------------------------------------------------------------------------//