# Use the official Node.js LTS (Long Term Support) image as the base image
FROM node:lts

# Set the working directory inside the container
WORKDIR /app

# Install Angular CLI globally using npm
RUN npm install -g @angular/cli

# Copy the package.json and package-lock.json files to the container
COPY package*.json ./

# Install the app dependencies
RUN npm install

# Copy all the application files to the container's working directory
COPY . .

# Expose port 4200 for the Angular app
EXPOSE 4200

# Start the Angular development server when the container starts
CMD ["ng", "serve", "--host", "0.0.0.0"]