# syntax=docker/dockerfile:1
FROM maven:3.9-eclipse-temurin-17 AS build
WORKDIR /build
COPY pom.xml .
COPY src ./src
RUN mvn -q -DskipTests package \
  && mv /build/target/guardsim-backend-*.jar /build/app.jar

FROM eclipse-temurin:17-jre-jammy
RUN apt-get update \
  && apt-get install -y --no-install-recommends curl \
  && rm -rf /var/lib/apt/lists/*
WORKDIR /app
# Персистентный том монтируется в /app/data (см. docker-compose)
ENV SPRING_DATASOURCE_URL=jdbc:h2:file:/app/data/guardsim;DB_CLOSE_DELAY=-1;DB_CLOSE_ON_EXIT=FALSE
COPY --from=build /build/app.jar /app/app.jar
EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=5s --start-period=50s --retries=3 \
  CMD curl -sf -H "X-GuardSim-Player: 00000000-0000-0000-0000-000000000099" -H "X-GuardSim-Demo: 1" http://127.0.0.1:8080/api/scenarios > /dev/null || exit 1
ENTRYPOINT ["java", "-jar", "/app/app.jar"]
