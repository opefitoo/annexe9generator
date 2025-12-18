#!/bin/sh
set -e

echo "Running migrations..."
python manage.py migrate --run-syncdb

echo "Seeding template..."
python manage.py seed_template

echo "Seeding user..."
python manage.py seed_user

echo "Starting gunicorn..."
exec gunicorn config.asgi:application -k uvicorn.workers.UvicornWorker --bind 0.0.0.0:8000
