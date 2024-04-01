# Start from the latest Ubuntu base image
FROM ubuntu:latest

# Install system dependencies for Playwright and Bun
RUN apt-get update && \
    apt-get install -y unzip curl libx11-6 libxext6 libxcb1 libglib2.0-0 libnss3 libdbus-1-3 libatk1.0-0 libatk-bridge2.0-0 libcups2 libgdk-pixbuf2.0-0 libgtk-3-0 libgbm1 libasound2 libxcomposite1 libterm-readline-perl-perl libxdamage1 libxfixes3 libxrandr2 libdrm2 libxkbcommon0 libatspi2.0-0 libpango-1.0-0 libcairo2 libexpat1 && \
    rm -rf /var/lib/apt/lists/*

# Install Bun
RUN curl -fsSL https://bun.sh/install | bash

# Set PATH to include Bun
ENV PATH="/root/.bun/bin:${PATH}"

# Set the working directory in the container
WORKDIR /app

# Copy the project files to the container
COPY . .

# Use Bun to install dependencies. Assume your dependencies are listed in package.json
RUN bun install

# Install Playwright dependencies. Adjust the command if Bun provides a direct method in the future.
RUN bunx playwright install chromium

# The command to run your application, adjust as necessary
CMD ["bun", "src/main.ts"]
