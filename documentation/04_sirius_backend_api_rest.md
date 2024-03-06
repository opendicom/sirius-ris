# Sirius Backend API REST

**Sirius RIS** provides a **RESTful API** from its **backend service** that will allow the management of your data securely and independently of the **frontend service**.

Within the resources directory of this repository you can find an **export** of all the requests that will be detailed below for [**Insomnia REST**](https://insomnia.rest/download).

---

# Authentication requests

The user authentication process can have three variants:

1. Human user with a single role.
2. Human user with more than one role.
3. Machine user (always has only one role).

In the event that the human or machine user has a single role, authentication to the system will be carried out in a single `/signin` step, obtaining from it the definitive **JWT** session (1d).



---

## `POST` <small>IP:PORT</small>/signin  <small>`machine-user`</small>

​	`admit: x-www-form-urlencoded`

* **username** = *string*. `REQUIRED`
* **password** = *string*. `REQUIRED`



In case of a satisfactory response, the **JWT** of the session (1d) will be obtained.



---

## `POST` <small>IP:PORT</small>/signin  <small>`human-user`</small>

​	`admit: x-www-form-urlencoded`

* **doc_country_code** = *number*. `REQUIRED`
* **doc_type** = *number*. `REQUIRED`
* **document** = *string*. `REQUIRED`
* **password** = *string*. `REQUIRED`


In case of a satisfactory response, a **JWT** will be obtained.

* If the user has only one role, the **JWT** granted is the session one (1d).
* Otherwise, where the user has more than one role, the **JWT** granted is of limited time (5m) for the **authorization request**.



---

## `POST` <small>IP:PORT</small>/signin/authorize  <small>`human-user`</small>

​	`admit: x-www-form-urlencoded` + `Bearer Token`

* **domain** = *ObjectId*. `REQUIRED`
* **role** = *number*. `REQUIRED`



In case of a satisfactory response, the **JWT** of the session (1d) will be obtained.



---

# Request methods for modules

**Sirius RIS Backend** provides the following list of **request methods** for each of the defined **modules**.



## `GET` <small>IP:PORT</small>/<small>`module`</small>/find

​	`admit: URL Query Parameters` + `Bearer Token`

* **filter** [`field_name`] = *string, number, boolean*.

* **proj** [`field_name`] = *number* (1 or 0 - Based on [MongoDB](https://www.mongodb.com/en/) projections).

* **sort** [`field_name`] = *number* (1 or -1 - Based on [MongoDB](https://www.mongodb.com/en/) sort definitions).

* **skip** = *number*.

* **limit** = *number*.

* **pager [page_number]** = *number*.

* **pager [page_limit]** = *number*.

* **regex** = *boolean* (Allows parameters set within **filter** to be submitted under a regular expression for similarity searches).

* **group [id]** = string (`field_name` - Based on [MongoDB](https://www.mongodb.com/en/) group definitions).

* **group [order]** = *string* (`first` or `last` - Based on [MongoDB](https://www.mongodb.com/en/) group definitions).

  

  > ***Notes:***
  >
  > * If the **_id** parameter is defined in the request within **filter**, the search method on the database will automatically be **findById** instead of **find**.
  >
  > * *If you use the **pager** parameters, keep in mind these overwrite the **skip** and **limit** parameters.*




---

## `GET` <small>IP:PORT</small>/<small>`module`</small>/findOne

​	`admit: URL Query Parameters` + `Bearer Token`

* **filter** [`field_name`] = *string, number, boolean*.
* **proj** [`field_name`] = *number* (1 or 0 - Based on [MongoDB](https://www.mongodb.com/en/) Projections).
* **sort** [`field_name`] = *number* (1 or -1 - Based on [MongoDB](https://www.mongodb.com/en/) Sort definitions).



---

## Operators for `find` and `findOne` requests

**find** and **findOne** methods have, in addition to the parameters detailed above, the possibility of including and combining **operators** within the **filter** parameter in order to refine the search criteria to obtain more precise results.

By **default**, if no operator is defined, it is assumed that the concatenation of all parameters defined within filter are under an **AND condition**.



### Logical operators `AND` , `OR`, `IN`, `ALL` :

* **AND** > **filter** [`and`] [`field_name`]
* **OR** >  **filter** [`or`] [`field_name`]
* **IN** > **filter** [`in`] [`field_name`] [`in_array_position_number`]
* **ALL** > **filter** [`all`] [`field_name`] [`all_array_position_number`]



### Operators for date range `GTE`, `LTE` :

* **GTE** > **filter** [`and`] [`field_name`] [`$gte`]
* **LTE** > **filter** [`and`] [`field_name`] [`$lte`]



### Operator `ElemMatch `:

The [`elemMatch`](https://www.mongodb.com/docs/manual/reference/operator/query/elemMatch/#mongodb-query-op.-elemMatch) operator matches documents that contain an array field with at least one element that matches all the specified query criteria.

**filter** [`elemMatch`] [`documents`] [`doc_country_code`]
**filter** [`elemMatch`] [`documents`] [`doc_type`]
**filter** [`elemMatch`] [`documents`] [`document`]



---

## `POST` <small>IP:PORT</small>/<small>`module`</small>/insert

​	`admit: x-www-form-urlencoded` or  `admit: multipart/form-data` (in cases where files are uploaded)  + `Bearer Token`

* Your models' fields: **name_field** = *value*. `REQUIRED`



---

## `POST` <small>IP:PORT</small>/<small>`module`</small>/update

​	`admit: x-www-form-urlencoded` or  `admit: multipart/form-data` (in cases where files are uploaded) + `Bearer Token`

* **id** = *ObjectId*. `REQUIRED`

* Fields to set: **field_name** = *value*. `REQUIRED`

* Field to unset: **unset** [`field_name`] = *empty_value*.

  

  > ***Notes:***
  >
  > * If a **field to set** is specified that does not exist within the module's schema, it will be ignored and detailed within a list called **blocked_attributes**.
  > * If a **field to unset** is specified and it is not allowed by the schema to be eliminated, it will be ignored and detailed within a list called **blocked_unset**.



---

## `POST` <small>IP:PORT</small>/<small>`module`</small>/delete

​	`admit: x-www-form-urlencoded` + `Bearer Token`

* **id** = *ObjectId*. `REQUIRED`
* **delete_code** = *string* `REQUIRED` | Defined in main settings (*see docker environment variables*).



---



# Additional requests

Some **Sirius RIS** modules have **additional requests** that allow specific operations to be performed. Below we will detail them.



## `GET` <small>IP:PORT</small>/exporter/reports

​	`admit: URL Query Parameters` + `Bearer Token`

* **start_date** = *YYYY-MM-DD*. <optional>
* **end_date** =  *YYYY-MM-DD*. <optional>
* **date** =  *YYYY-MM-DD*. <optional>
* **doc_country_code** = *number*. <optional>
* **doc_type** = *number*. <optional>
* **document** = *string*. <optional>
* **pager [page_number]** = *number*. <optional>
* **pager [page_limit]** = *number*. <optional>



* The **exporter** module allows a **machine user** to extract information (`reports`) according to their access level.
* This particular module is designed to provide **interoperability** towards **external organizations**.



---

## `GET` <small>IP:PORT</small>/users/findByService

​	`admit: URL Query Parameters` + `Bearer Token`

* **service** = *ObjectId*. `REQUIRED`
* **role** = *number*.
* All parameters and operators supported in the **find** request.



*This request, as its name says, allows you to search for users under the service in which they are working.*



---

## `GET` <small>IP:PORT</small>/users/findByRoleInReport

`admit: URL Query Parameters` + `Bearer Token`

* **role_in_report** = *string* (`signer` or `authenticator`) `REQUIRED`
* All parameters and operators supported in the **find** request.



*This request allows you to search for users who can fulfill the functionality of signing or authenticating reports (independent of their role in the application).*



---

## `POST` <small>IP:PORT</small>/slots/batch/insert

​	`admit: x-www-form-urlencoded` + `Bearer Token`

* Your models' fields: **name_field** = *value*. `REQUIRED`
* **range_start** = *YYYY-MM-DDTHH:MM:SS.sssZ*  `REQUIRED`
* **range_end** = *YYYY-MM-DDTHH:MM:SS.sssZ*  `REQUIRED`
* **day** [`day_number`] = *boolean*. `REQUIRED`



#### day_number:

0: Sunday, 1: Monday, 2: Tuesday, 3: Wednesday, 4: Thursday, 5: Friday, 6: Saturday.



---

## `POST` <small>IP:PORT</small>/<small>`specific-modules`</small>/delete

​	`admit: x-www-form-urlencoded` + `Bearer Token`

* **_id** [`index`] = *ObjectId*. `REQUIRED`

* **delete_code** = *string* `REQUIRED` | Defined in main settings (*see docker environments variables*).

  

#### specific-modules:

* slots
* procedure_categories
* files



---

## `POST` <small>IP:PORT</small>/mwl/insert

​	`admit: x-www-form-urlencoded` + `Bearer Token`

* **fk_appointment** = *ObjectId*. `REQUIRED`



*This request allows sending an **appointment** to the **MWL** of the **PACS** through MLLP (TCP).*
