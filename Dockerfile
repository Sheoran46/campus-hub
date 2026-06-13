# Stage 1: Build the application with Maven
FROM maven:3.9.6-eclipse-temurin-21 AS build

# Set the working directory
WORKDIR /app

# Copy the Maven wrapper and pom.xml to leverage Docker cache
COPY .mvn/ .mvn
COPY mvnw pom.xml ./

# Optional: Make the wrapper executable
RUN chmod +x mvnw

# Download dependencies (this step is cached unless pom.xml changes)
RUN ./mvnw dependency:go-offline

# Copy the rest of the source code
COPY src ./src

# Package the application
RUN ./mvnw clean package -DskipTests

# Stage 2: Create the final lightweight image
FROM eclipse-temurin:21-jre-jammy

# Set the working directory
WORKDIR /app

# Copy the executable jar from the build stage
COPY --from=build /app/target/LostAndFound-0.0.1-SNAPSHOT.jar app.jar

# Expose the port the app runs on
EXPOSE 8080

# Command to run the application
ENTRYPOINT ["java","-jar","app.jar"]
