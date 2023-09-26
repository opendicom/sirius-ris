//--------------------------------------------------------------------------------------------------------------------//
// AUTH MIDDLEWARES:
//--------------------------------------------------------------------------------------------------------------------//
//Import app modules:
const mainServices  = require('../main.services');                          // Main services
const mainSettings  = mainServices.getFileSettings();                       // File settings (YAML)
const currentLang   = require('../main.languages')(mainSettings.language);  // Language Module

//--------------------------------------------------------------------------------------------------------------------//
// ACCESS CONTROL:
//--------------------------------------------------------------------------------------------------------------------//
const accessControl = (req, res, next) => {
    //Get IP Client:
    let clientIP = mainServices.getIPClient(req); 
    
    //Initialize IP Arrays:
    let firstRegisteredIPs = [];
    let secondRegisteredIPs = [];
    let registeredIPs = [];
    
    //Only after the existence of the REGISTERED_IPS environment variable:
    if(process.env.REGISTERED_IPS){
        //Split requests ',':
        firstRegisteredIPs = process.env.REGISTERED_IPS.split(',').filter((element) => {return element.length != 0});;

        //Split attributes of each request:
        for (let key in firstRegisteredIPs){
            secondRegisteredIPs[key] = firstRegisteredIPs[key].split('|').filter((element) => {return element.length != 0});;
        }

        //Create final object:
        for (let key in secondRegisteredIPs){
            registeredIPs[secondRegisteredIPs[key][0].toString()] = {
                counter     : secondRegisteredIPs[key][1],
                last_req    : secondRegisteredIPs[key][2],
                penalty_req : mainServices.stringToBoolean(secondRegisteredIPs[key][3].toString())
            };
        }
    }

    //Check if the IP is registered, if not register it:
    if(registeredIPs[clientIP]){
        //Parse counter value (string) to integer (base 10) and increment:
        let counter = parseInt(registeredIPs[clientIP].counter, 10) + 1;

        //Calculate difference between dates (seconds):
        let start = parseInt(registeredIPs[clientIP].last_req, 10);
        let end = Date.now();
        let time_elapsed = Math.round((end - start)/1000);

        //Check if the IP is penalized:
        if(registeredIPs[clientIP].penalty_req && time_elapsed <= mainSettings.AC_PENALTY_TIME){
            //Sanction current IP:
            penaltyClient(req, res, registeredIPs, clientIP);
            return;

        //If the time elapsed is <= AC_TIME_WINDOW:
        } else if(time_elapsed <= mainSettings.AC_TIME_WINDOW){
            //Check if the allowed amount of AC_NUMBER_OF_ATTEMPTS was not exceeded:
            if(registeredIPs[clientIP].counter >= mainSettings.AC_NUMBER_OF_ATTEMPTS){

                //Sanction current IP:
                penaltyClient(req, res, registeredIPs, clientIP);
                return;

            } else {
                //Increment counter, update last request and preserve penalty_req (don't touch):
                process.env.REGISTERED_IPS = process.env.REGISTERED_IPS.replace(
                    clientIP + '|' + registeredIPs[clientIP].counter + '|' + registeredIPs[clientIP].last_req, //String reemplazar
                    clientIP + '|' + counter + '|' + Date.now(), //String actualizado
                );
            }
        } else {
            //Reset counter, update last request and preserve penalty_req (don't touch):
            process.env.REGISTERED_IPS = process.env.REGISTERED_IPS.replace(
                clientIP + '|' + registeredIPs[clientIP].counter + '|' + registeredIPs[clientIP].last_req, //String reemplazar
                clientIP + '|' + 1 + '|' + Date.now(), //String actualizado
            );
        }
    } else {
        //First time - Initialize counter (Add request to enviroment var):
        //Initialize penalty_req in false
        process.env.REGISTERED_IPS = process.env.REGISTERED_IPS.concat(clientIP + '|' + 1 + '|' + Date.now() + '|false' + ',');
    }

    //If everything is correct, allow to continue:
    next();
}
//--------------------------------------------------------------------------------------------------------------------//

//--------------------------------------------------------------------------------------------------------------------//
// PENALTY CLIENT:
//--------------------------------------------------------------------------------------------------------------------//
function penaltyClient(req, res, registeredIPs, clientIP){
    //Update last request:
    process.env.REGISTERED_IPS = process.env.REGISTERED_IPS.replace(
        clientIP + '|' + registeredIPs[clientIP].counter + '|' + registeredIPs[clientIP].last_req + '|' + registeredIPs[clientIP].penalty_req, //String reemplazar
        clientIP + '|' + registeredIPs[clientIP].counter + '|' + Date.now() + '|true', //String actualizado
    );

    //Send WARN Message:
    mainServices.sendConsoleMessage('WARN', currentLang.http.sancioned, registeredIPs);

    //Respond with a sanction message and not allow to continue until the penalty time has expired:
    res.status(401).send({ success: false, message: currentLang.http.sancioned_msj });
}
//--------------------------------------------------------------------------------------------------------------------//

//--------------------------------------------------------------------------------------------------------------------//
//Export middlewares:
module.exports = {
    accessControl
};
//--------------------------------------------------------------------------------------------------------------------//