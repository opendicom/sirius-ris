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
                counter: secondRegisteredIPs[key][1],
                last_req: secondRegisteredIPs[key][2]
            };
        }
    }

    //Check if the IP is registered, if not register it:
    if(registeredIPs[clientIP]){
        //Parse counter value (string) to integer (base 10) and increment:
        let counter = parseInt(registeredIPs[clientIP].counter) + 1;

        //Calculate difference between dates (seconds):
        let start = parseInt(registeredIPs[clientIP].last_req);
        let end = Date.now();
        let time_elapsed = Math.round((end - start)/1000);

        //If the time elapsed is <= AUTH_PENALTY_TIME_WINDOW:
        if(time_elapsed <= mainSettings.AUTH_PENALTY_TIME_WINDOW){
            //Check if the allowed amount of AUTH_PENALTY_RATE_LIMIT was not exceeded:
            if(registeredIPs[clientIP].counter >= mainSettings.AUTH_PENALTY_RATE_LIMIT){
                //Update last request:
                process.env.REGISTERED_IPS = process.env.REGISTERED_IPS.replace(
                    clientIP + '|' + registeredIPs[clientIP].counter + '|' + registeredIPs[clientIP].last_req, //String reemplazar
                    clientIP + '|' + registeredIPs[clientIP].counter + '|' + Date.now(), //String actualizado
                );

                //Send console message:
                console.log('SANCIONED CLIENTS:');
                console.log(registeredIPs);

                //Respond with a sanction message and not allow to continue until the penalty time has expired:
                res.status(401).send({ success: false, message: 'Ha realizado demasiados intentos de singin dentro del tiempo permitido.' });
                return;
            } else {
                //Increment counter and update las request:
                process.env.REGISTERED_IPS = process.env.REGISTERED_IPS.replace(
                    clientIP + '|' + registeredIPs[clientIP].counter + '|' + registeredIPs[clientIP].last_req, //String reemplazar
                    clientIP + '|' + counter + '|' + Date.now(), //String actualizado
                );
            }
        } else {
            //Reset counter and update last request:
            process.env.REGISTERED_IPS = process.env.REGISTERED_IPS.replace(
                clientIP + '|' + registeredIPs[clientIP].counter + '|' + registeredIPs[clientIP].last_req, //String reemplazar
                clientIP + '|' + 1 + '|' + Date.now(), //String actualizado
            );
        }
    } else {
        //First time - Initialize counter (Add request to enviroment var):
        process.env.REGISTERED_IPS = process.env.REGISTERED_IPS.concat(clientIP + '|' + 1 + '|' + Date.now() + ',');
    }
    
    //If everything is correct, allow to continue:
    next();
}
//--------------------------------------------------------------------------------------------------------------------//

//--------------------------------------------------------------------------------------------------------------------//
//Export middlewares:
module.exports = {
    accessControl
};
//--------------------------------------------------------------------------------------------------------------------//