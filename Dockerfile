# Start from the latest Ubuntu base image
FROM oven/bun:latest

ENV NODE_ENV=production

# Set the working directory in the container
WORKDIR /app

# Copy the project files to the container
COPY . .

# Use Bun to install dependencies. Assume your dependencies are listed in package.json
RUN bun install

# Install Playwright dependencies. Adjust the command if Bun provides a direct method in the future.
RUN bunx playwright install chromium
RUN bunx playwright install-deps

# The command to run your application, adjust as necessary
CMD ["bun", "src/main.ts"]
