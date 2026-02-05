FROM python:3.11-slim

WORKDIR /app

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

COPY . ./

# Cloud Run sets $PORT; default to 8080 for local container runs
ENV PORT=8080

CMD ["sh", "-c", "exec gunicorn -b :${PORT} --workers 2 --threads 8 --timeout 0 app:app"]
