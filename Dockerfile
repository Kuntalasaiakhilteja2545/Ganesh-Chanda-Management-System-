FROM python:3.11-slim

WORKDIR /app

# Copy the Django backend into the image
COPY backend /app

# Install Python dependencies during the build phase
RUN pip install --no-cache-dir -r requirements.txt

# Collect static files
ENV DJANGO_SETTINGS_MODULE=config.settings.production
RUN python manage.py collectstatic --noinput || true

EXPOSE 8000

CMD ["sh", "-c", "python manage.py migrate --noinput && gunicorn config.wsgi:application --bind 0.0.0.0:${PORT:-8000}"]
