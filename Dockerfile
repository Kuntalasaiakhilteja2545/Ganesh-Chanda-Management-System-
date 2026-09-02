FROM python:3.11-slim

WORKDIR /app

# Copy the Django backend into the image
COPY backend /app

# Install Python dependencies during the build phase
RUN pip install --no-cache-dir -r requirements.txt

# Collect static files
RUN python manage.py collectstatic --noinput

EXPOSE 8000

CMD ["gunicorn", "config.wsgi:application", "--bind", "0.0.0.0:8000"]
