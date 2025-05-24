# Start from a Python base image (choose a version compatible with Manim)
FROM python:3.10-slim

# Set environment variables to make Python output unbuffered
ENV PYTHONUNBUFFERED=1
ENV PYTHONDONTWRITEBYTECODE=1

# Set the working directory in the container
WORKDIR /usr/src/app

# Install system dependencies needed by Manim, FFmpeg, TeX Live, and BUILD TOOLS
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
    # --- Build tools are crucial for packages like pycairo ---
    build-essential \
    # --- FFmpeg for video processing ---
    ffmpeg \
    # --- TeX Live for LaTeX rendering by Manim ---
    texlive-latex-base \
    texlive-latex-extra \
    texlive-fonts-recommended \
    texlive-science \
    dvisvgm \ 
    # --- Dependencies for Manim's graphics backend (Cairo/Pango) ---
    libcairo2-dev \
    libpango1.0-dev \
    libglib2.0-dev \
    pkg-config \
    # --- Other utilities ---
    # git \
    # curl \
    # --- Cleanup should be part of the SAME RUN instruction ---
    && apt-get clean && \
    rm -rf /var/lib/apt/lists/*

# Copy the requirements file into the container first
COPY requirements.txt ./

# Install Python dependencies from requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

# Copy the rest of your application code (the 'app' directory) into the container
COPY ./app /usr/src/app/app

# Expose the port the app runs on
EXPOSE 8080

# Define the command to run your application using Gunicorn (for Flask)
CMD ["gunicorn", "-w", "2", "--bind", "0.0.0.0:8080", "--timeout", "360", "app.main:app"]