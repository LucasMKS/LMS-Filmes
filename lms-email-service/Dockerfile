# Etapa 1: build do jar usando Maven
FROM maven:3.9.6-eclipse-temurin-21 AS build
WORKDIR /app

# Copiar pom.xml e baixar dependências
COPY pom.xml .
COPY mvnw .
COPY .mvn .mvn
RUN chmod +x ./mvnw
RUN ./mvnw dependency:go-offline -B

# Copiar código fonte e compilar
COPY src ./src
RUN ./mvnw clean package -DskipTests

# Etapa 2: imagem final para rodar a aplicação
FROM eclipse-temurin:21-jdk
WORKDIR /app

# Copiar o JAR da etapa de build (ajustado para artifactId correto)
COPY --from=build /app/target/email-0.0.1-SNAPSHOT.jar app.jar

# Expor porta
EXPOSE 8080

# Rodar a aplicação
ENTRYPOINT ["java", "-jar", "app.jar"]
