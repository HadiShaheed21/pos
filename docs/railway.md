# Railway deployment

FloCafe’s Railway deployment uses its local SQLite database; it does not use
Supabase or PostgreSQL.

The included `railway.toml` builds the frontend and backend and starts the
standalone POS server. In Railway, attach a persistent Volume to the service at
`/data`. Railway exposes that mount path to the app at runtime, and FloCafe then
uses these persistent paths automatically:

- `/data/flo.db` for the SQLite database
- `/data/backups` for local database backups and recovery files

On a new volume, startup creates the database and backup directory. On later
deployments, it opens the existing database in place and runs normal migrations;
it does not reset, replace, or copy over the database.

For a nonstandard persistent mount, configure `FLO_DB_PATH` and, optionally,
`FLO_BACKUP_DIR` to absolute paths on that mount. Do not set either value to a
path outside the persistent Volume.

Before the first deploy, create or attach the Railway Volume with mount path
`/data`. Do not use Railway’s volume wipe action for an existing POS database.
