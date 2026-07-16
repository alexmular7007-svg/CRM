# ═══════════════════════════════════════════════════════════════════════════
# Optimized Multi-stage Dockerfile for CRM Backend (Railway-friendly)
# ═══════════════════════════════════════════════════════════════════════════

# ───────────────────────────────────────────────────────────────────────────
# Stage 1: Build with dependency caching
# ───────────────────────────────────────────────────────────────────────────
# Using public.ecr.aws registry as fallback for better Railway connectivity
FROM public.ecr.aws/docker/library/maven:3.9-eclipse-temurin-21-alpine AS build

WORKDIR /app

# Copy pom.xml first (better layer caching)
COPY pom.xml .

# Download dependencies BEFORE copying source code
# This layer is cached unless pom.xml changes
RUN mvn dependency:resolve dependency:resolve-plugins -q || true

# Copy source code
COPY src ./src

# Build application (skip tests for faster builds)
RUN mvn clean package -DskipTests -q

# ───────────────────────────────────────────────────────────────────────────
# Stage 2: Runtime
# ───────────────────────────────────────────────────────────────────────────
# Using public.ecr.aws registry for better Railway connectivity
FROM public.ecr.aws/docker/library/eclipse-temurin:21-jre-alpine

WORKDIR /app

# Create non-root user
RUN addgroup -S spring && adduser -S spring -G spring

# Create upload directory with correct ownership BEFORE switching user
RUN mkdir -p /tmp/uploads/chat /tmp/uploads/task-attachments && \
    chown -R spring:spring /tmp/uploads && \
    chmod -R 755 /tmp/uploads

USER spring:spring

# Copy JAR from build stage
COPY --from=build /app/target/*.jar app.jar

# Expose port
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:8080/actuator/health || exit 1

# Run application — defaults to prod profile; override via SPRING_PROFILES_ACTIVE env var
ENTRYPOINT ["java", \
    "-XX:+UseContainerSupport", \
    "-XX:MaxRAMPercentage=75.0", \
    "-Djava.security.egd=file:/dev/./urandom", \
    "-Dspring.profiles.active=prod", \
    "-jar", \
    "app.jar"]
