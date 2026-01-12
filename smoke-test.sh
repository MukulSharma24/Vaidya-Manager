#!/usr/bin/env bash
set -euo pipefail

API="http://localhost:4000"
DBHOST="host.docker.internal,14330"
SA_PW="shajag123!"

echo "API health:"
curl -s $API/api/health | jq || true

echo
echo "Insert test patient via API..."
resp=$(curl -s -X POST "$API/api/patients" -H "Content-Type: application/json" -d '{
  "FirstName":"Smoke",
  "MiddleName":"Test",
  "LastName":"User",
  "DateOfBirth":"1995-05-05",
  "Age":30,
  "Gender":"M",
  "PhoneNumber":"9000000000",
  "Email":"smoke@example.com",
  "AddressLine1":"smokestreet"
}')
echo "API response: $resp"

echo
echo "Recent PatientMaster rows from DB:"
docker run --rm mcr.microsoft.com/mssql-tools /bin/bash -c \
  "/opt/mssql-tools/bin/sqlcmd -S $DBHOST -U sa -P '$SA_PW' -Q \"SELECT TOP 5 PatientID, FirstName, LastName, PhoneNumber, Email FROM dbo.PatientMaster ORDER BY PatientID DESC;\" -s\",\" -W"
