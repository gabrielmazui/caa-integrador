FROM eclipse-temurin:21-jdk

WORKDIR /app

COPY gradlew settings.gradle build.gradle ./
COPY gradle ./gradle

# Download Gradle distribution and all dependencies at build time
RUN ./gradlew dependencies --no-daemon -q 2>/dev/null || true

COPY src ./src

EXPOSE 8080

CMD ["./gradlew", "bootRun", "--no-daemon"]
