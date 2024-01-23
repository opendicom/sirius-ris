//--------------------------------------------------------------------------------------------------------------------//
// SIGNER SERVICE:
//--------------------------------------------------------------------------------------------------------------------//
//Import external modules:
const fs = require('fs');
const signer = require('node-signpdf');
const {
  PDFDocument,
  PDFName,
  PDFNumber,
  PDFHexString,
  PDFString,
  PDFArray,
  CharCodes
} = require('pdf-lib');

//Import app modules:
const mainServices  = require('../../main.services');
const mainSettings  = mainServices.getFileSettings();                            // File settings (YAML)
const currentLang   = require('../../main.languages')(mainSettings.language);    // Language Module

// This length can be derived from the following `node-signpdf` error message:
// ./node_modules/node-signpdf/dist/signpdf.js:155:19
const SIGNATURE_LENGTH = mainSettings.signature_length;
//--------------------------------------------------------------------------------------------------------------------//


//--------------------------------------------------------------------------------------------------------------------//
// SIGN PDF:
//--------------------------------------------------------------------------------------------------------------------//
async function signPDF (pdfBuffer, p12Buffer, passphrase, signed_filename) {
    const pdfDoc = await PDFDocument.load(pdfBuffer);
    const pages = pdfDoc.getPages();
    
    const ByteRange = PDFArrayCustom.withContext(pdfDoc.context);
    ByteRange.push(PDFNumber.of(0));
    ByteRange.push(PDFName.of(signer.DEFAULT_BYTE_RANGE_PLACEHOLDER));
    ByteRange.push(PDFName.of(signer.DEFAULT_BYTE_RANGE_PLACEHOLDER));
    ByteRange.push(PDFName.of(signer.DEFAULT_BYTE_RANGE_PLACEHOLDER));

    const signatureDict = pdfDoc.context.obj({
        Type: 'Sig',
        Filter: 'Adobe.PPKLite',
        SubFilter: 'adbe.pkcs7.detached',
        ByteRange,
        Contents: PDFHexString.of('A'.repeat(SIGNATURE_LENGTH)),
        Reason: PDFString.of('Internal Approval'), //This type of information is required in some work processes (eg: Title 21 CFR part 11).
        M: PDFString.fromDate(new Date()),
    });
    const signatureDictRef = pdfDoc.context.register(signatureDict);

    const widgetDict = pdfDoc.context.obj({
        Type: 'Annot',
        Subtype: 'Widget',
        FT: 'Sig',
        Rect: [0, 0, 0, 0],
        V: signatureDictRef,
        T: PDFString.of('Signature1'),
        F: 4,
        P: pages[0].ref,
    });
    const widgetDictRef = pdfDoc.context.register(widgetDict);

    // Add our signature widget to the first page:
    pages[0].node.set(PDFName.of('Annots'), pdfDoc.context.obj([widgetDictRef]));

    // Create an AcroForm object containing our signature widget:
    pdfDoc.catalog.set(
        PDFName.of('AcroForm'),
        pdfDoc.context.obj({
            SigFlags: 3,
            Fields: [widgetDictRef],
        }),
    );

    const modifiedPdfBytes = await pdfDoc.save({ useObjectStreams: false });
    const modifiedPdfBuffer = Buffer.from(modifiedPdfBytes);

    const signObj = new signer.SignPdf();
    const signedPdfBuffer = signObj.sign(modifiedPdfBuffer, p12Buffer, {
        passphrase: passphrase,
    });

    // Write the signed file:
    fs.writeFileSync('./tmp/' + signed_filename, signedPdfBuffer);
}
//--------------------------------------------------------------------------------------------------------------------//

//--------------------------------------------------------------------------------------------------------------------//
// PDF ARRAY CUSTOM:
//--------------------------------------------------------------------------------------------------------------------//
// Extends PDFArray class in order to make ByteRange look like this:
// ByteRange [0 /********** /********** /**********]
// Not this:
// ByteRange [ 0 /********** /********** /********** ]
//--------------------------------------------------------------------------------------------------------------------//
class PDFArrayCustom extends PDFArray {
  static withContext(context) {
    return new PDFArrayCustom(context);
  }

  clone(context) {
    const clone = PDFArrayCustom.withContext(context || this.context);
    for (let idx = 0, len = this.size(); idx < len; idx++) {
      clone.push(this.array[idx]);
    }
    return clone;
  }

  toString() {
    let arrayString = '[';
    for (let idx = 0, len = this.size(); idx < len; idx++) {
      arrayString += this.get(idx).toString();
      if (idx < len - 1) arrayString += ' ';
    }
    arrayString += ']';
    return arrayString;
  }

  sizeInBytes() {
    let size = 2;
    for (let idx = 0, len = this.size(); idx < len; idx++) {
      size += this.get(idx).sizeInBytes();
      if (idx < len - 1) size += 1;
    }
    return size;
  }

  copyBytesInto(buffer, offset) {
    const initialOffset = offset;

    buffer[offset++] = CharCodes.LeftSquareBracket;
    for (let idx = 0, len = this.size(); idx < len; idx++) {
      offset += this.get(idx).copyBytesInto(buffer, offset);
      if (idx < len - 1) buffer[offset++] = CharCodes.Space;
    }
    buffer[offset++] = CharCodes.RightSquareBracket;

    return offset - initialOffset;
  }
}
//--------------------------------------------------------------------------------------------------------------------//

//--------------------------------------------------------------------------------------------------------------------//
// Export service module:
//--------------------------------------------------------------------------------------------------------------------//
module.exports = { signPDF };
//--------------------------------------------------------------------------------------------------------------------//