# Usar OpenJDK 21 como base
FROM openjdk:21-jdk-slim

# Definir diretório de trabalho
WORKDIR /app

# Copiar arquivos do Maven
COPY pom.xml .
COPY mvnw .
COPY .mvn .mvn

# Dar permissão de execução ao Maven wrapper
RUN chmod +x ./mvnw

# Baixar dependências
RUN ./mvnw dependency:go-offline -B

# Copiar código fonte
COPY src ./src

# Construir a aplicação
RUN ./mvnw clean package -DskipTests

# Expor porta 8083 (porta para o serviço de favoritos)
EXPOSE 8083

# Comando para executar a aplicação
CMD ["java", "-jar", "target/lmsfavorite-0.0.1-SNAPSHOT.jar"]