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

RUN apt-get update \
    && apt-get install -y --no-install-recommends curl \
    && rm -rf /var/lib/apt/lists/*

COPY --from=builder /build/target/configserver.jar /app/configserver.jar

EXPOSE 8071
ENTRYPOINT ["java", "-jar", "/app/configserver.jar"]
