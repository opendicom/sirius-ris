# Scheduled tasks and Backups

The `opendicom/opendicom_sirius_database` image published on DockerHub has 3 additional elements from its predecessor image `mongo:latest`(official).

- Automatic database restore.
- Execution of scheduled tasks with cron.
- Implementation of a database backup script with retention policy for dumps and logs.

---



## Mongorestore

The automatic database restore functionality simply checks for the existence of a database with the name defined in the `MONGO_INITDB_DATABASE` environment variable.

In case a database with the same name defined in that variable exists, the restore is not executed, but in case a database with the name defined in the `MONGO_INITDB_DATABASE` environment variable is not found, the script will perform a database restore taking the data from the file `/dumps/entrypoint.dump`.



---



## Scheduled tasks with `cron`

Cron by default looks for changes in `/etc/crontab` and `/etc/cron.d/*` when it detects a change, updates its in-memory task list from that files. This behavior works perfectly from a full operating system, but it can fail from some containers, so that, when there is a change in a configuration file, cron does not detect it and therefore does not install the new task in memory.

For this reason `opendicom/opendicom_sirius_database` handles cron with some peculiarity. There is a `/etc/crontab` file that contains the desired cron settings. Every time the container is created or started it loads the configuration from this file into memory. If this file is changed after the initial container it will be necessary to manually load the configuration into memory or restart the container.



### Load cron configuration manually

To manually load the cron configuration after you modified the /crontab_file:

```bash
docker exec -it container_name bash
crontab /etc/crontab
```



### Use environment variables from cron

Cron does not access user environments variales so they must be configured in some way. When the container starts, it reads the user environment variables and create a script in `/.env` that export them. This script can be executed automaticaly in every cron task by simply setting `BASH_ENV=/.env` variable in the cron configuraction file `/etc/crontab`



---



## Database backups script

Inside the cron file defined in `/etc/crontab` of the `opendicom/opendicom_sirius_database` image, the following line is commented by default:

```bash
0 1 * * * /opt/scripts/backup.sh /backups/ 10
```



By uncommenting this line and restarting the container to take the changes to the `/etc/crontab` file, a script will start to run according to the defined periodicity (default: *every day at 1:00*), which will make backups of the **sirius-ris ** database on the `/backups` path.

This script has a policy to control the retention of the number of dumps and logs to be preserved (default 10). This is intended to avoid an accumulation of unnecessary backups that could fill the available storage on a volume intended for backups.
