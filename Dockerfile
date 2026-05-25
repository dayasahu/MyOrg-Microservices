# Multi-stage build. No JDK or Maven needed on the host - Docker does it all.

# ----- Stage 1: build the jar -----
FROM maven:3.9.9-eclipse-temurin-21 AS builder
WORKDIR /build

COPY pom.xml .
RUN mvn -B dependency:go-offline

COPY src ./src
RUN mvn -B clean package -DskipTests

# ----- Stage 2: runtime -----
FROM eclipse-temurin:21-jre
WORKDIR /app

# This module has no <finalName> override, so jar name keeps version suffix.
COPY --from=builder /build/target/gateway-server-0.0.1-SNAPSHOT.jar /app/gateway-server.jar

EXPOSE 8888
ENTRYPOINT ["java", "-jar", "/app/gateway-server.jar"]
