# Select a base image that includes Python
FROM python:3.10.12-slim

# Allow statements and log messages to immediately appear in the native logs
ENV PYTHONUNBUFFERED True

# Set the working directory in the container
ENV APP_HOME /app
WORKDIR $APP_HOME

# Install the required packages first so the dependency layer is cached
COPY requirements.txt .
RUN pip install --upgrade pip
RUN pip install --no-cache-dir -r requirements.txt

# Copy all files in the current directory into the container
COPY . .

# Expose the port the app runs on
EXPOSE 5000

# Run the web service on container startup.
# Gunicorn, not `python app.py` -- the Flask dev server must never serve
# production traffic (and would expose the Werkzeug debugger if DEBUG were set).
# Cloud Run injects PORT; default to 5000 for local `docker run`.
CMD exec gunicorn --bind :${PORT:-5000} --workers 1 --threads 8 --timeout 120 app:app
