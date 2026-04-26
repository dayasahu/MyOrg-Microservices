FROM eclipse-temurin:21-jre

WORKDIR /app

ARG JAR_FILE=target/auth-service.jar
COPY ${JAR_FILE} /app/auth-service.jar

EXPOSE 9000

ENTRYPOINT ["java", "-jar", "/app/auth-service.jar"]
