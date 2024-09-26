#!/bin/bash

# ##################################################################################################### #
# Description:
# This script performs opendicom/sirius-ris backups.
#
# Version: 1.0.0
# Maintainer: opendicom
# ##################################################################################################### #

function check_envvar() {
  # Capture parameters:
  local FILE_LOG=$1
  local ENV=$2

  echo "["`date +%Y/%m/%d_%H:%M:%S`"] COMPROBACIÓN DE VARIABLE DE ENTORNO ($ENV):" >> $FILE_LOG

  # Check env var  existence:
  if [ "$(echo $ENV)" == "" ]; then
    echo "["`date +%Y/%m/%d_%H:%M:%S`"] ERROR: Variable de entorno $ENV no definida." >> $FILE_LOG
    exit 1
  fi
  echo "["`date +%Y/%m/%d_%H:%M:%S`"] OK: Variable de entorno $ENV definida." >> $FILE_LOG
}

function check_directory() {
  # Capture parameters:
  local FILE_LOG=$1
  local DIR=$2

  echo "["`date +%Y/%m/%d_%H:%M:%S`"] COMPROBACIÓN DE DIRECTORIO DE DESTINO ($DIR):" >> $1

  # Check directory existence:
  if [ ! -d "$DIR" ]; then
  	echo "["`date +%Y/%m/%d_%H:%M:%S`"] ERROR: El directorio $DIR no existe." >> $1
    exit 1
  fi
  echo "["`date +%Y/%m/%d_%H:%M:%S`"] OK: Comprobación de directorio exitosa." >> $1
}

function retain_policy(){
  # Capture parameters:
  local FILE_LOG=$1
  local DIR=$2
  local FILE_PREFIX=$3
  local RETAIN=$4

  #Set currend working directory
  local WORKDIR=$(pwd)

  # Go to the directory:
  cd $DIR

  echo "["`date +%Y/%m/%d_%H:%M:%S`"] APLICANDO POLITICA DE RETENCIÓN: $DIR" >> $FILE_LOG

  local CURRENT_FILE_COUNT=$(ls | wc -l)
  if [ $CURRENT_FILE_COUNT -ge $RETAIN ]; then
     local FILE_TO_DELETE=$(find -type f -name "*$FILE_PREFIX*" -printf '%T+ %P\n' | sort | head -n1 | cut -f2 -d' ')
     rm -f $FILE_TO_DELETE
     echo "["`date +%Y/%m/%d_%H:%M:%S`"] OK: Borrado archivo $DIR$FILE_TO_DELETE" >> $FILE_LOG
  fi
  echo "["`date +%Y/%m/%d_%H:%M:%S`"] OK: Politica de retención aplicada exitosamente." >> $FILE_LOG
  cd $WORKDIR
}

function database_backup(){
  # Capture parameters:
  local FILE_LOG=$1
  local BACKUP_FILENAME=$2

  echo "["`date +%Y/%m/%d_%H:%M:%S`"] CREANDO DUMP DE BASE DE DATOS: $DBNAME" >> $FILE_LOG

  #Backup database:
  mongodump --authenticationDatabase admin -u ${MONGO_INITDB_ROOT_USERNAME} -p ${MONGO_INITDB_ROOT_PASSWORD} --db ${MONGO_INITDB_DATABASE} --archive > $BACKUP_FILENAME

  if [ $? != 0 ]; then
  	echo "["`date +%Y/%m/%d_%H:%M:%S`"] ERROR: Hubo algun problema en el dump de la base de datos." >> $FILE_LOG
  	exit 1
  fi
  echo "["`date +%Y/%m/%d_%H:%M:%S`"] OK: Dump exitoso." >> $FILE_LOG
}

function run_backup(){
    local BACKUP_DST_PATH=$1
    local BACKUP_RETENTION=$2
    local PREFIX="sirius_db_backup"
    local BACKUP_FILENAME=`date +%Y-%m-%d_%H-%M-%S`"_"$PREFIX".dump"

    local LOG_PATH=$BACKUP_DST_PATH"log/"
    local FILE_LOG=$LOG_PATH`date +%Y-%m-%d_%H-%M-%S`".log"

    # Check existence of directories:
    check_directory $FILE_LOG $BACKUP_DST_PATH

    # Check existence of environment variables with values:
    check_envvar $FILE_LOG "MONGO_INITDB_DATABASE"
    check_envvar $FILE_LOG "MONGO_INITDB_ROOT_PASSWORD"
    check_envvar $FILE_LOG "MONGO_INITDB_ROOT_USERNAME"

    # Applying retention policies on backup files:
    retain_policy $FILE_LOG $BACKUP_DST_PATH $PREFIX $BACKUP_RETENTION

    # Applying retention policies on log files:
    retain_policy $FILE_LOG $LOG_PATH ".log" $BACKUP_RETENTION

    # Backup database:
    database_backup $FILE_LOG $BACKUP_DST_PATH$BACKUP_FILENAME
}

#Run backup script:
run_backup $1 $2