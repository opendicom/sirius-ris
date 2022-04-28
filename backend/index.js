//--------------------------------------------------------------------------------------------------------------------//
// INDEX:
//--------------------------------------------------------------------------------------------------------------------//
//Import modules:
const path          = require("path");
const fs            = require('fs');
const mainServer    = require('./main.server');

function runserver (){
    try {
        //If main.settings.yaml exist:
        if (fs.existsSync(path.resolve('./', 'main.settings.yaml'))){
            //Run backend web server:
            mainServer();
        }
    }
    catch(err){
        console.log('The main.settings.yaml file does NOT exist.');
        console.log('This file is necessary to run Sirius RIS backend server.');
        console.error(err);
    }
}

//Run server:
runserver();
//--------------------------------------------------------------------------------------------------------------------//