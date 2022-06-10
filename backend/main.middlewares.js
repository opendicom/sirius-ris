//--------------------------------------------------------------------------------------------------------------------//
// MAIN MIDDLEWARES:
//--------------------------------------------------------------------------------------------------------------------//

//Import external modules:
const jwt = require('jsonwebtoken');

//Import app modules:
const mainServices  = require('./main.services');                           // Main services
const mainSettings  = mainServices.getFileSettings();                       // File settings (YAML)
const currentLang   = require('./main.languages')(mainSettings.language);   // Language Module

//Import main permissions:
const mainPermissions = require('./main.permissions');

//Import Module Services:
const moduleServices = require('./modules/modules.services');

//--------------------------------------------------------------------------------------------------------------------//
//  ALLOWED VALIDATE:
//--------------------------------------------------------------------------------------------------------------------//
// Allowed Validate checks the schema of the current model which elements can be set and which cannot.
// The allowed elements are returned in a set object to be validated.
// The NOT allowed elements are returned to an object called blocked.
// Separate unset values 'unset[value]' and block not allowed values to unset.
//--------------------------------------------------------------------------------------------------------------------//
const allowedValidate = (allowedSchemaKeys, AllowedUnsetValues = []) => {
    return (req, res, next) => {
        if(req.body){
            //Initialize attrAllowed and attrNotAllowed objects:
            let attrAllowed = {};
            let attrNotAllowed = {};

            //Initialize validation result object (Inside the Request):
            req.validatedResult = {};
            
            //Loop through elements of the POST request:
            Object.entries(req.body).forEach(([key, value]) => {
                //Check if the element you want to modify exists or not in the current model:
                if(allowedSchemaKeys.includes(key)){
                    //Set allowed parameters:
                    attrAllowed[key] = value;
                } else {
                    //Save parameters NOT allowed:
                    attrNotAllowed[key] = value;
                }
            });

            //Check if there is data to modify:
            if(Object.keys(attrAllowed).length === 0){
                req.validatedResult['set'] = false; //No data to modify. 
            } else {
                req.validatedResult['set'] = attrAllowed; //Assign validated allowed attributes.
            }

            //Check if there are NOT allowed attributes:
            if(Object.keys(attrNotAllowed).length === 0){
                req.validatedResult['blocked'] = false; //No blocked attributes.
            } else {
                req.validatedResult['blocked'] = attrNotAllowed; //Return attributes NOT allowed.

                //Check unset values:
                if(attrNotAllowed.unset){
                    Object.keys(attrNotAllowed.unset).forEach((current) => {
                        //If not allowed to unset -> bloqued_unset:
                        if(AllowedUnsetValues.includes(current)){
                            //Set to unset:
                            if(!req.validatedResult.hasOwnProperty('unset')){
                                req.validatedResult['unset'] = {}
                            }

                            //Add unset value:
                            req.validatedResult['unset'][current] = attrNotAllowed.unset[current]; //Separate unset values:
                        } else {
                            //Set to blocked_unset:
                            if(!req.validatedResult.hasOwnProperty('blocked_unset')){
                                req.validatedResult['blocked_unset'] = {}
                            }
                            
                            //Add blocked_unset value:
                            req.validatedResult['blocked_unset'][current] = attrNotAllowed.unset[current]; //Separate unset values:
                        }
                    });

                    //Remove unset values from blocked:
                    delete req.validatedResult['blocked'].unset;
                } else {
                    req.validatedResult['unset'] = false; //No unset attributes.
                    req.validatedResult['blocked_unset'] = false; //No blocked_unset attributes.
                }
            }

            //Check if blocked unset is defined:
            if(!req.validatedResult.hasOwnProperty('blocked_unset')){
                req.validatedResult['blocked_unset'] = false; //No blocked_unset attributes.
            }
        }
        
        next();
    }
};
//--------------------------------------------------------------------------------------------------------------------//

//--------------------------------------------------------------------------------------------------------------------//
// IS PASSWORD:
// Encrypts the fields designated as passwords in the schema before saving them to the database.
//--------------------------------------------------------------------------------------------------------------------//
const isPassword = (Schema, fieldName = 'password') => {
    //PRE SAVE INSERT:
    Schema.pre('save', function(next){
        //Check if the password field exists according to the name indicated:
        if(!this[fieldName]) return next(); //If password is not updated:
        
        //Hash the password:
        const data = this;
        mainServices.hashPass(data[fieldName])
            .then((hash) => {
                 //Save hashed password:
                 data[fieldName] = hash;
                 next();
            })
            .catch((err) => {
                //Send error:
                next(err);
            }
        );
    });
    
    //PRE SAVE UPDATE:
    Schema.pre('findOneAndUpdate', async function(next){
        //Check if the password field exists according to the name indicated:
        if(!this._update.$set[fieldName]) return next(); //If password is not updated:

        //Hash the password:
        mainServices.hashPass(this._update.$set[fieldName])
            .then((hash) => {
                //Create set object to preserve fieldName as key:
                let set = {};
                set[fieldName] = hash;

                //Set hashed password:
                this.set(set);
            })
            .catch((err) => {
                //Send error:
                next(err);
            }
        );
    });

    //Return MongoDB Schema:
    return Schema;
}
//--------------------------------------------------------------------------------------------------------------------//

//--------------------------------------------------------------------------------------------------------------------//
// CHECK JWT:
// Checks for the existence of a JWT and validates it to protect itself from unwanted requests.
//--------------------------------------------------------------------------------------------------------------------//
const checkJWT = (req, res, next) => {
    //Initializate reqInfo:
    let reqInfo = '';

    //Get bearer token from headers:
    let token = req.headers['x-access-token'] || req.headers['authorization'];

    //Validate that token exists:
    if(!token){
        //Set request info:
        reqInfo = '\njwt: ' + currentLang.jwt.check_empty_token;

        //Send INFO Message:
        mainServices.sendConsoleMessage('INFO', mainServices.reqReceived(req) + reqInfo);

        //Send response:
        res.status(401).send({ success: false, message: currentLang.jwt.check_empty_token });
        return;
    }

    //Sanitize header token: 
    if(token.startsWith('Bearer ')){
        token = token.slice(7, token.length);
    }

    //Validate header token:
    if(token){
      jwt.verify(token, mainSettings.AUTH_JWT_SECRET, (err, decoded) => {
        if(err){
            //Set request info:
            reqInfo = '\njwt: ' + currentLang.jwt.check_invalid_token;

            //Send response:
            return res.status(401).send({ success: false, message: currentLang.jwt.check_invalid_token, error: err.message });
        } else {
            //Save decoded token in req and pass to next middleware:
            req.decoded = decoded;
            next();
        }
      });
    }

    //Send INFO Message:
    mainServices.sendConsoleMessage('INFO', mainServices.reqReceived(req) + reqInfo);
};
//--------------------------------------------------------------------------------------------------------------------//

//--------------------------------------------------------------------------------------------------------------------//
// CHECK DELETE CODE:
//--------------------------------------------------------------------------------------------------------------------//
const checkDeleteCode = (req, res, next) => {
    if(req.body.delete_code == mainSettings.delete_code){
        next();
    } else {
        return res.status(401).send({ success: false, message: 'Para eliminar un elemento debe especificar el código de eliminación válido.' });
    }
};
//--------------------------------------------------------------------------------------------------------------------//


//--------------------------------------------------------------------------------------------------------------------//
// ROLE ACCESS BASED CONTROL:
//--------------------------------------------------------------------------------------------------------------------//
const roleAccessBasedControl = async (req, res, next) => {
    //Initialize flow control variables:
    let operationResult = '';
    let domainResult = true;
    let haveConsession = false;

    //Get authenticated user information (Decoded JWT):
    const userAuth = {
        _id: req.decoded.sub,
        domain: req.decoded.session.domain,
        role: req.decoded.session.role,
        consession: req.decoded.session.consession
    };

    //Get request information:
    const requested = {
        schema: req.baseUrl.slice(1),   //Slice to remove '/' (first character).
        method: req.path.slice(1),      //Slice to remove '/' (first character).
    };

    //Check mainPermissions.consessionPermissions against currentConsessions (User auth consession):
    await Promise.all(Object.keys(mainPermissions.consessionPermissions).map(async (currentConsession) => {
        
        //Check if the user has a consession:
        if(userAuth.consession.includes(parseInt(currentConsession, 10))){

            //Check if the user consession has the request SCHEMA:
            if(Object.keys(mainPermissions.consessionPermissions[currentConsession]).includes(requested.schema)){

                //Check if the user consession has the request METHOD:
                if(mainPermissions.consessionPermissions[currentConsession][requested.schema].includes(requested.method)){
                    //Set have consession:
                    haveConsession = true;  // Has the indicated consession.
                }   
            }
        }
    }));

    //Check if current role is allowed for current SCHEMA or have a concession:
    if(Object.keys(mainPermissions.rolePermissions[userAuth.role]).includes(requested.schema) || haveConsession){

        //Check if current role is allowed for current METHOD or have a concession:
        if(mainPermissions.rolePermissions[userAuth.role][requested.schema].includes(requested.method) || haveConsession){

            //What the domain corresponds to:
            const domainType = await moduleServices.domainIs(userAuth.domain, res);
            
            //Exclude Superuser role:
            if(userAuth.role != 1){
                //Add domain as condition:
                domainResult = moduleServices.addDomainCondition(req, res, domainType);
            }

            //Set operation result:
            if(domainResult) {
                operationResult = 'allowed'
                next();
            } else {
                //Set operation result:
                operationResult = 'denied'

                //Send response:
                return res.status(401).send({ success: false, message: 'La operación que está intentando realizar no está permitida para el dominio que posee su autenticación.' });
            }
            
        } else {
            //Set operation result:
            operationResult = 'denied'
    
            //Send response:
            return res.status(401).send({ success: false, message: 'El usuario no posee los permisos necesarios sobre el método: ' + requested.method + ' -> ' + requested.schema });
        }

        
    } else {
        //Set operation result:
        operationResult = 'denied'

        //Send response:
        return res.status(401).send({ success: false, message: 'El usuario no posee los permisos necesarios sobre el esquema: ' + requested.schema });
    }

    //Send DEBUG Message:
    mainServices.sendConsoleMessage('DEBUG', '\nuser auth: ' + JSON.stringify(userAuth) + '\nuser request: ' + JSON.stringify(requested), 'operation: ' + operationResult);
    
}
//--------------------------------------------------------------------------------------------------------------------//


//--------------------------------------------------------------------------------------------------------------------//
//Export middlewares:
module.exports = {
    allowedValidate,
    isPassword,
    checkJWT,
    checkDeleteCode,
    roleAccessBasedControl
};
//--------------------------------------------------------------------------------------------------------------------//