
## Variables (opcional)
# Si quieres, exporta estas variables para no repetir host/puerto/usuario/db:
# export PGHOST=localhost
# export PGPORT=5440
# export PGUSER=postgres
# export PGDATABASE=visicontrol

## 1) Esquema (tablas, vistas, triggers, funciones)
psql -h $PGHOST -p $PGPORT -U $PGUSER -d $PGDATABASE -f db/schema.sql

## 2) (Opcional) archivos separados si quieres inspeccionar por partes
# psql -h $PGHOST -p $PGPORT -U $PGUSER -d $PGDATABASE -f db/functions.sql
# psql -h $PGHOST -p $PGPORT -U $PGUSER -d $PGDATABASE -f db/views.sql
# psql -h $PGHOST -p $PGPORT -U $PGUSER -d $PGDATABASE -f db/triggers.sql

## 3) Datos (elige uno)
psql -h $PGHOST -p $PGPORT -U $PGUSER -d $PGDATABASE -f db/seed.sql
# o, si preferiste un dataset pequeño:
# psql -h $PGHOST -p $PGPORT -U $PGUSER -d $PGDATABASE -f db/seed_mini.sql
