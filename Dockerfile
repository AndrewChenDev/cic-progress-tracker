# Start from the latest Ubuntu base image. Consider pinning to a specific tag for reproducibility.
FROM oven/bun:latest

# It's generally a good practice to define environment variables as late as possible if they're not needed for build steps,
# but in this case, it's fine since NODE_ENV is often used to control how dependencies are installed.
ENV NODE_ENV=production

# Set the working directory in the container
WORKDIR /app

# Copy only the package.json (and possibly package-lock.json, bun.lock.json, etc.) before running `bun install`
# to leverage Docker's layer caching. Only re-run `bun install` if these files change.
COPY package.json bun.lock.json* ./

# Use Bun to install dependencies. This assumes your dependencies are listed in package.json
RUN bun install --production

# Copy the rest of the project files to the container. This prevents unnecessary reinstallation of node modules
# if only source code files change.
COPY . .

# install Playwright dependencies
RUN bunx playwright install chromium && \
    bunx playwright install-deps

# The command to run your application, adjust as necessary
CMD ["bun", "src/main.ts"]
