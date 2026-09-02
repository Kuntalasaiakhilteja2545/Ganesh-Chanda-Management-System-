#!/bin/bash
set -e

# Move into the Django backend directory
cd backend

# Install Python dependencies
pip install --no-cache-dir -r requirements.txt

# Apply database migrations
python manage.py migrate --noinput

# Start the Django app with gunicorn
exec gunicorn config.wsgi:application --bind 0.0.0.0:8000
