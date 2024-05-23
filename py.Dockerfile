FROM python:3.12

# Set working directory
WORKDIR /app

# Copy project files to container
COPY generator/ /app/
COPY prisma/ /app/

RUN pip install -r requirements.txt
RUN pip install -e .
RUN prisma generate --generator pyClient

# CMD ["hypercorn", "api"]

# docker build -t emailwise-generator:latest -f py.Dockerfile .
# docker run --rm --env-file .env -e DATABASE_URL=postgresql://postgres:postgreses@host.docker.internal:5432/postgres -p 8000:8000 emailwise-generator:latest hypercorn api --bind=0.0.0.0:8000
# docker run --rm --env-file .env -e DATABASE_URL=postgresql://postgres:postgreses@host.docker.internal:5432/postgres -e BROKER_URL=redis://host.docker.internal:6379/0 emailwise-generator:latest python worker.py