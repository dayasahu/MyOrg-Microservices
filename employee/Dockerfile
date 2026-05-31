# Multi-stage build. No JDK or Maven needed on the host - Docker does it all.

# ----- Stage 1: build the jar -----
FROM maven:3.9.9-eclipse-temurin-21 AS builder
WORKDIR /build

# Cache layer for Maven dependencies. Re-runs only when pom.xml changes,
# not when source files change - keeps incremental rebuilds fast.
COPY pom.xml .
RUN mvn -B dependency:go-offline

COPY src ./src
RUN mvn -B clean package -DskipTests

# ----- Stage 2: runtime -----
FROM eclipse-temurin:21-jre
WORKDIR /app

# Pulls the finalName=employee jar produced by the build stage.
COPY --from=builder /build/target/employee.jar /app/employee.jar

EXPOSE 8080
ENTRYPOINT ["java", "-jar", "/app/employee.jar"]
