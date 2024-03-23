# Start from the Microsoft provided Playwright image
FROM mcr.microsoft.com/playwright:latest

ENV PATH="/root/.bun/bin:${PATH}"
ENV NODE_ENV=production

RUN apt-get update && apt-get install -y unzip
RUN curl -fsSL https://bun.sh/install | bash

# Set the working directory in the container
WORKDIR /app

# Copy the project files to the container
COPY . .

# Use Bun to install dependencies. Assume your dependencies are listed in bun.lockb or package.json
RUN bun install
RUN bun playwright install


# The command to run your application, adjust as necessary
CMD ["bun", "src/main.ts"]
