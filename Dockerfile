# Multi-stage Dockerfile for CRM Backend (Railway-friendly)
# This Dockerfile is at the root to work with Railway's build system

FROM public.ecr.aws/docker/library/maven:3.9-eclipse-temurin-21-alpine AS build

WORKDIR /app

# Copy pom.xml from crm-backend
COPY crm-backend/pom.xml .

# Download dependencies
RUN mvn dependency:resolve dependency:resolve-plugins -q || true

# Copy source code from crm-backend
COPY crm-backend/src ./src

# Build application
RUN mvn clean package -DskipTests -q

# ───────────────────────────────────────────────────────────────────────────
# Runtime Stage
FROM public.ecr.aws/docker/library/eclipse-temurin:21-jre-alpine

WORKDIR /app

# Create non-root user
RUN addgroup -S spring && adduser -S spring -G spring

# Create upload directories
RUN mkdir -p /tmp/uploads/chat /tmp/uploads/task-attachments && \
    chown -R spring:spring /tmp/uploads && \
    chmod -R 755 /tmp/uploads

USER spring:spring

# Copy JAR from build stage
COPY --from=build /app/target/*.jar app.jar

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:8080/actuator/health || exit 1

ENTRYPOINT ["java", \
    "-XX:+UseContainerSupport", \
    "-XX:MaxRAMPercentage=75.0", \
    "-Djava.security.egd=file:/dev/./urandom", \
    "-Dspring.profiles.active=prod", \
    "-jar", \
    "app.jar"]
