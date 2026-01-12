set -euo pipefail

USER="${SA_USER:-sa}"
PASS="${SA_PASSWORD:-shajag123!}"
HOST="${DB_HOST:-mssql}"
PORT="${DB_PORT:-1433}"

echo "Waiting for SQL Server..."
for i in {1..60}; do
  /opt/mssql-tools/bin/sqlcmd -S "${HOST},${PORT}" -U "${USER}" -P "${PASS}" -Q "SELECT 1" >/dev/null 2>&1 && break
  echo "still waiting... ($i)"
  sleep 2
done

exists=$(/opt/mssql-tools/bin/sqlcmd -S "${HOST},${PORT}" -U "${USER}" -P "${PASS}" -h -1 -W -Q "SET NOCOUNT ON; SELECT COUNT(*) FROM sys.tables WHERE name='SchemaVersion';" | tr -d '[:space:]')

if [ "${exists}" != "0" ]; then
  echo "SchemaVersion exists (DB already initialized). Exiting."
  exit 0
fi

echo "Running SQL scripts..."
for f in /scripts/*.sql; do
  echo "-> executing: $f"
  /opt/mssql-tools/bin/sqlcmd -S "${HOST},${PORT}" -U "${USER}" -P "${PASS}" -i "$f"
done

/opt/mssql-tools/bin/sqlcmd -S "${HOST},${PORT}" -U "${USER}" -P "${PASS}" -Q "
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'SchemaVersion')
BEGIN
  CREATE TABLE SchemaVersion (VersionNum VARCHAR(50), AppliedAt DATETIME DEFAULT SYSDATETIME());
  INSERT INTO SchemaVersion (VersionNum) VALUES ('v1.0');
END
"

echo "DB initialization complete."
