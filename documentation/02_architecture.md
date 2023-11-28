# Architecture

This document will detail the main aspects of the **Sirius RIS** architecture.



## Services

The **Sirius RIS** stack is made up of three simple elements: 

* Frontend `Web server | nginx`
* Backend server `API RESTful | NodeJS`
* Database server `MongoDB`



![sirius_services](./resources/img/sirius_services.png)





## Integración con Wezen

The numbers in the diagram represents the steps in the communication sequence.



![sirius_wezen](./resources/img/sirius_wezen.png)





> **URL with JWT (5m) Example:**
> http://ohif/viewer/dicomjson?url=WEZEN_HOST:WEZEN_PORT?session=JWT_5m%26StudyInstanceUID=2.3.5.345...



---



## UML

Inside the resources directory of this repository you can find the **UML** diagram of the **Sirius RIS** data collections.



![UML](./resources/img/UML.png)



---



## Modality Worklist HL7 `ORM | MLLP`

The modality work list (**MWL**), is built from **Sirius RIS** at the time of check-in for a patient who attends their appointment.
The patient data and the procedure to be performed are sent by **MLLP** in an **HL7 v2** message to the **PACS** that is configured in the installation (**environments**).



#### Sirius RIS HL7 Message Structure

The segments (lines) are separated by =x0D

```
MSH|^~\&|||||||ORM^O01|||2.3.1
PID|||ID^^^^II||PN||PB|PS
PV1||||||||^RF
ORC|NW||||||^^^DT^^T|||||||||||||||||||||||||||
OBR||||^^SD||||||||||||^RQ||AN|RP|SS|AE|||MO|||||||||^PP||||||||||RD
ZDS|UI
```



- **ID**: identificador de paciente [PID-3] (00100020)
- **II**: ID issuer [PID-3.5] (00100021) (opcional)
- **PN**: nombre de paciente [PID-5] (00100010)
- **PB**: fecha nacimiento paciente [PID-7] (00100030)
- **PS**: sexo paciente [PID-8] (00100040) (M, F, O)
- **RF**: referring physician (PV1-8, 00080090) (Médico de cabecera)
- **DT**: date time [ORC-7.4] (00400002,00400003) AAAAMMDDHHMMSS
- T: prioridad media
- **SD**: SPS desc / code [OBR-4.4] (00400007) [OBR-4.3+4+5] (00400008) (Descripcion procedimiento, Pasos)
- **RQ**: Requesting Physician [OBR-16] (00321032) (Referring)
- **AN**: accession number [OBR-18] (00080050) 16 caracteres max AAAAMMDDMMSSNN
- **RP**: Requested Procedure ID [OBR-19] (00401001) (opcional)
- **SS**: Scheduled step ID [OBR-20] (00400009) (opcional)
- **AE**: Scheduled station AET [OBR-21] (00400001) (AET equipment | opcional)
- **MO**: modalidad [OBR-24] (00080060) < modality> (code_value)
- **PP**: Performing Physician [OBR-34] (00400006) (Reporting | short_org^short_branch^nombre_usuario_completo) (- todos)
- **RD**: RP desc/code [OBR-44^2] (00321060) [OBR-4.1^2^3] (00321064) (RM Rodillla derecha)
- **UI**: studyUID [ZDS-1] (0020000D)



---



## Global elements

Throughout the entire **Sirius RIS** application, reference is made on many occasions to **indexes** of global elements which will be detailed below to improve the understanding of the code and maintenance of the application itself.



### Tipos de documentos

| Indice | Tipo de documento                |
| ------ | -------------------------------- |
| 1      | ID Nacional (DNI, CI, CURP, RUT) |
| 2      | Pasaporte                        |
| 3      | Credencial cívica                |
| 4      | Licencia de conducir             |
| 5      | Permiso de residencia            |
| 6      | Visa                             |
| 7      | Documento transitorio            |



> La tabla de referencias de **Tipos de documentos** fue cotejada en base a los tipos de documentos soportados por país a nivel mundial. Es decir los documentos que poseían la mayor cantidad de repeticiones en cuanto a ser admitidos como válidos en distintos países (Ref: https://onfido.com/supported-documents/).



---



### Roles de usuarios

| Indice | Rol de usuario |
| ------ | -------------- |
| 1      | Superusuario   |
| 2      | Administrador  |
| 3      | Supervisor     |
| 4      | Médico         |
| 5      | Técnico        |
| 6      | Enfermero      |
| 7      | Coordinador    |
| 8      | Recepcionista  |
| 9      | Paciente       |
| 10     | Funcional      |



---



### Concesiones para usuarios



| Indice | Concesión                                      |
| ------ | ---------------------------------------------- |
| 1      | Búsquedas avanzadas                            |
| 2      | Posibilidad de firmar estudios                 |
| 3      | Posibilidad de autenticar estudios             |
| 4      | Estadísticas generales                         |
| 5      | Estadísticas de nivel médico / investigación   |
| 6      | Estadísticas sobre usuarios                    |
| 7      | Listados de apoyo a facturación                |
| 8      | Posibilidad de ingresar estudios sin citas     |
| 9      | Eliminaciones físicas de registros específicos |



---



### Tipos de género

| Indice | Género    |
| ------ | --------- |
| 1      | Masculino |
| 2      | Femenino  |
| 3      | Otros     |



---



### Tipo de evento para Logs

| Indice | Evento                        |
| ------ | ----------------------------- |
| 1      | Login                         |
| 2      | Login error                   |
| 3      | Logout                        |
| 4      | Actualización de contraseña   |
| 5      | Creación de `ELEMENTO`        |
| 6      | Guardado de `ELEMENTO`        |
| 7      | Autoguardado de `ELEMENTO`    |
| 8      | Eliminación de `ELEMENTO`     |
| 9      | Adjuntar archivo a `ELEMENTO` |



> Existen eventos de log que dependeran de la existencia de un **ELEMENTO** por su interacción con los mismos.
> Los **Tipos de elementos** contemplados son los siguientes:
>
> * Usuarios
> * Turnos
> * Solicitudes
> * Estudios
> * Informes



---



### Estados para el control de flujo de elementos (Flow states)

Las siguientes referencias fueron definidas para poder establecer el control de flujo de los elementos que a continuación serán detallados.



##### Solicitudes

| Indice | Estado                      |
| ------ | --------------------------- |
| A01    | Área administración         |
| A02    | Retenido por administración |
| A03    | Área médica                 |
| A04    | Retenido por médico         |
| A05    | Área de coordinación        |
| A06    | Retenido por coordinación   |
| A07    | Coordinado                  |
| A08    | Cancelado                   |
| A09    | Para eliminar               |



##### Estudios

| Indice | Estado                 |
| ------ | ---------------------- |
| S01    | Recepción              |
| S02    | Para entrevistar       |
| S03    | Para inyectar/preparar |
| S04    | Para consola           |
| S05    | Para liberar           |
| S06    | Para informar          |
| S07    | Cancelado              |
| S08    | Para eliminar          |



##### Informes

| Indice | Estado              |
| ------ | ------------------- |
| R01    | Informe borrador    |
| R02    | Informe firmado     |
| R03    | Informe autenticado |
| R04    | Para eliminar       |

