FROM python:3.11-slim

# Set working directory
WORKDIR /app

# Install system dependencies and fonts with Arabic support
RUN apt-get update && apt-get install -y --no-install-recommends \
    fonts-dejavu \
    fonts-liberation \
    fonts-noto-core \
    fonts-noto-ui-core \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements first (better caching)
COPY requirements.txt .

# Install dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy bot files
COPY . .

# Run the bot
CMD ["python", "aljawad.py"]
