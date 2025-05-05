# Development guide

General aspects will be detailed below for those who wish to contribute to the development of **Sirius RIS**.

---



## Preparation of development environment

* Download and install [NodeJS](https://nodejs.org/en).
* Download and install [Git](https://git-scm.com/).
* Clone **Sirius RIS** repository:

```bash
git clone opendicom/sirius-ris
```



### Bakend:

* Install **backend** dependencies [ Run inside project `src` folder ]:

```bash
npm install
```



### Frontend:

* In case there is a previous installation of **Angular** on the computer:

```bash
npm uninstall -g @angular-cli
npm cache verify
npm cache clean --force
```



* Install **Angular 13** [ Specific version in which **Sirius RIS** is written ]:

```bash
npm install -g @angular/cli@13.1.2
npm install -g @angular-devkit/build-angular@13.1.2
npm install --save-dev @angular-devkit/build-angular@13.3.4
```



* Install **frontend** dependencies [ Run inside project `src` folder ]:

```bash
npm install --legacy-peer-deps
```



---



## Dependencies [`self-solved`]

The dependencies [`self-solved`] of **Sirius RIS** will be detailed below.

* **Backend:**

`argon2 ^0.28.5` , `cors ^2.8.5` , `crypto-js ^4.1.1` , `express ^4.17.1` , `express-validator ^6.10.0` , `fs ^0.0.1-security` , `html-to-pdfmake ^2.4.20` , `http ^0.0.1-security` , `https ^1.0.0` , `js-yaml ^4.0.0` , `jsdom ^22.0.0` , `jsonwebtoken ^9.0.0` , `moment ^2.29.1` , `mongoose ^5.12.1` , `multer ^1.4.5-lts.1` , `nodemailer ^6.9.2` , `path ^0.12.7` , `pdfmake ^0.2.7`



* **Frontend:**

`@angular/animations ~13.1.0 ` , `@angular/cdk ^13.1.1 ` , `@angular/common ~13.1.0 ` , `@angular/compiler ~13.1.0 ` , `@angular/core ~13.1.0 ` , `@angular/flex-layout ^13.0.0-beta.36 ` , `@angular/forms ~13.1.0 ` , `@angular/material ^13.1.1 ` , `@angular/platform-browser ~13.1.0 ` , `@angular/platform-browser-dynamic ~13.1.0 ` , `@angular/router ~13.1.0 ` , `@auth0/angular-jwt ^5.0.2 ` , `@ckeditor/ckeditor5-angular ^4.0.0 ` , `@ckeditor/ckeditor5-build-classic ^35.1.0 ` , `@fullcalendar/angular ^5.11.2 ` , `@fullcalendar/core ^5.11.3 ` , `@fullcalendar/interaction ^5.11.3 ` , `@fullcalendar/resource-common ^5.11.3 ` , `@fullcalendar/resource-timegrid ^5.11.3 ` , `country-state-city ^3.1.2 ` , `flag-icon-css ^4.1.7 ` , `html-to-pdfmake ^2.4.9 ` , `pdfmake ^0.2.6 ` , `rxjs ~7.4.0 ` , `tslib ^2.3.0 ` , `xlsx 0.19.3` , `zone.js ~0.11.4`



* **Frontend build:**

`@angular-devkit/build-angular ^13.1.2 ` , `@angular/cli ~13.1.2 ` , `@angular/compiler-cli ~13.1.0 ` , `@types/html-to-pdfmake ^2.1.1 ` , `@types/jasmine ~3.10.0 ` , `@types/node ^12.11.1 ` , `@types/pdfmake ^0.2.2 ` , `jasmine-core ~3.10.0 ` , `karma ~6.3.0 ` , `karma-chrome-launcher ~3.1.0 ` , `karma-coverage ~2.1.0 ` , `karma-jasmine ~4.0.0 ` , `karma-jasmine-html-reporter ~1.7.0 ` , `typescript ~4.5.2`



---



## Steps to add an element to the `Backend`

1. Add **Schema**.
2. Add **Routes**.
3. Check **isDuplicated** method for this element.
4. Import **Schema** and **Routes** into **main server**.
5. Create **Handlers** if necessary.
6. Add the case in **adjustDataTypes** method (`aggregation cases`)
7. If this element is referenced with fk in another element, add the case in **checkReferences** method.
8. Add the case in **addDomainCondition** method.
9. Add the case in **Main Permissions** object.
