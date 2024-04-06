FROM oven/bun:latest
ENV NODE_ENV=production

# Set the working directory in the container
WORKDIR /app

# Copy only the package.json
COPY package.json bun.lockb ./

# Use Bun to install dependencies. This assumes your dependencies are listed in package.json
RUN bun install --production

# Copy the rest of the project files
COPY . .

# install Playwright dependencies
RUN bunx playwright install chromium && \
    bunx playwright install-deps

# The command to run your application
CMD ["bun", "src/main.ts"]
