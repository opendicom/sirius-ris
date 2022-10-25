//--------------------------------------------------------------------------------------------------------------------//
// TCP CLIENT HANDLER:
//--------------------------------------------------------------------------------------------------------------------//
//Import external modules:
const net = require('net');

//Import app modules:
const mainServices  = require('../../../main.services');                            // Main services
const mainSettings  = mainServices.getFileSettings();                               // File settings (YAML)
const currentLang   = require('../../../main.languages')(mainSettings.language);    // Language Module

//Set TCP server params:
const serverTCP = {
    port: mainSettings.mwl_client.port,
    host: mainSettings.mwl_client.host
};

module.exports = async (req, res) => {
    //Create HL7 Message:
    const HL7 = 'MSH|^~\&|||||||ORM^O01|||2.3.1|PID|||ID^^^^II||PN||PB|PS|PV1||||||||^RF|ORC|NW||||||^^^DT^^T|||||||||||||||||||||||||||OBR||||^^SD||||||||||||^RQ||AN|RP|SS|AE|||MO|||||||||^PP||||||||||RD|ZDS|UI';

    //Create TCP client:
    const client = net.createConnection(serverTCP);
    
    //Establish connection to TCP server:
    client.on('connect', () => {
        //Send DEBUG Message:
        mainServices.sendConsoleMessage('DEBUG', '\nMWL insert [hl7 sended]: ' + HL7);
    
        //Send message to TCP server (PACS - MWL):
        client.write(HL7);
    
        //Close connection (End communication):
        client.end();

        //Send successfully response:
        res.status(200).send({ success: true, message: currentLang.ris.mwl_success, hl7: HL7 });
    });
    
    //Handle errors:
    client.on('error', (error) => {
        //Send ERROR Message:
        mainServices.sendConsoleMessage('ERROR', currentLang.ris.mwl_error, error.message);

        //Return error message (HTML Response):
        res.status(500).send({ success: false, message: currentLang.ris.mwl_error, error: error.message });
    });
}
//--------------------------------------------------------------------------------------------------------------------//