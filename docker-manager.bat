@echo off
chcp 65001 >nul
title LMS Films - Docker Manager

:: Define cores para a interface
set "COLOR_TITLE=echo [96m"
set "COLOR_SECTION=echo [93m"
set "COLOR_SUCCESS=echo [92m"
set "COLOR_WARNING=echo [91m"
set "COLOR_INFO=echo [94m"
set "COLOR_RESET=echo [0m"

:menu
cls
%COLOR_TITLE%================================================================
%COLOR_TITLE%                  LMS FILMS - DOCKER MANAGER                  
%COLOR_TITLE%================================================================
echo.

%COLOR_SECTION%^>^> GESTAO COMPLETA DA STACK
echo    1 - Iniciar Arquitetura de Microsservicos Completa
echo    2 - Parar todos os servicos (docker compose down)
echo    3 - Reconstruir e iniciar toda a aplicacao (--no-cache)
echo.

%COLOR_SECTION%^>^> GESTAO DE SERVICOS INDIVIDUAIS
echo   10 - Iniciar Apenas a Infraestrutura (Bancos de Dados, Redis, etc.)
echo   11 - Iniciar Apenas a Arquitetura (Eureka + Gateway)
echo   12 - Iniciar Apenas os Microsservicos da Aplicacao
echo   13 - Iniciar Apenas o Frontend
echo.

%COLOR_SECTION%^>^> RECONSTRUIR (BUILD)
echo   20 - Reconstruir API Principal (lmsfilmes)
echo   21 - Reconstruir API Gateway
echo   22 - Reconstruir Microsservicos (Favorite, Rating, Email)
echo   23 - Reconstruir Frontend
echo.

%COLOR_SECTION%^>^> UTILITARIOS E MONITORIZACAO
echo   30 - Verificar status dos containers
echo   31 - Visualizar logs de um servico
echo   32 - Acessar CLI do MongoDB
echo   33 - Acessar CLI do Redis
echo   34 - Abrir RabbitMQ Management UI
echo.
echo    0 - Sair
echo.
%COLOR_TITLE%================================================================
echo.
set /p choice=" Escolha uma opcao: "

if "%choice%"=="1" goto start_microservices_stack
if "%choice%"=="2" goto stop_all
if "%choice%"=="3" goto rebuild_all

if "%choice%"=="10" goto start_infra
if "%choice%"=="11" goto start_architecture
if "%choice%"=="12" goto start_app_microservices
if "%choice%"=="13" goto start_frontend

if "%choice%"=="20" goto rebuild_backend
if "%choice%"=="21" goto rebuild_gateway
if "%choice%"=="22" goto rebuild_microservices
if "%choice%"=="23" goto rebuild_frontend

if "%choice%"=="30" goto check_status
if "%choice%"=="31" goto logs
if "%choice%"=="32" goto mongo_cli
if "%choice%"=="33" goto redis_cli
if "%choice%"=="34" goto rabbitmq_management

if "%choice%"=="0" goto exit

%COLOR_WARNING%Opcao invalida!
timeout /t 2 /nobreak >nul
goto menu

:: ================================================================
:: FUNCOES DE VERIFICACAO (INTERNAS)
:: ================================================================
:check_service_running
:: Parametro %1: nome do servico (ex: eureka)
docker compose ps %1 | findstr "running" >nul
if %errorlevel% neq 0 (
    exit /b 1
) else (
    exit /b 0
)

:wait_for_service
:: Parametro %1: nome do servico (ex: eureka)
:: Parametro %2: tempo maximo de espera em segundos
setlocal
set SERVICE_NAME=%1
set MAX_WAIT=%2
set COUNT=0

%COLOR_INFO%Aguardando o servico '%SERVICE_NAME%' iniciar...
:wait_loop
call :check_service_running %SERVICE_NAME%
if %errorlevel% equ 0 (
    %COLOR_SUCCESS%Servico '%SERVICE_NAME%' esta em execucao!
    goto :eof
)
if %COUNT% geq %MAX_WAIT% (
    %COLOR_WARNING%Tempo de espera esgotado para o servico '%SERVICE_NAME%'. Verifique os logs.
    goto :eof
)
timeout /t 1 /nobreak >nul
set /a COUNT+=1
goto wait_loop
endlocal
goto :eof


:: ================================================================
:: GESTAO COMPLETA
:: ================================================================
:start_microservices_stack
cls
%COLOR_INFO%🚀 Iniciando Arquitetura de Microsservicos Completa...
docker compose up -d
%COLOR_SUCCESS%✅ Stack completa iniciada!
call :print_urls
goto end

:stop_all
cls
%COLOR_INFO%⏹️  Parando todos os servicos...
docker compose down
%COLOR_SUCCESS%✅ Todos os servicos foram parados!
goto end

:rebuild_all
cls
%COLOR_INFO%🔄 Reconstruindo aplicacao completa (pode demorar)...
docker compose down
docker compose build --no-cache
docker compose up -d
%COLOR_SUCCESS%✅ Aplicacao completa reconstruida e iniciada!
call :print_urls
goto end


:: ================================================================
:: GESTAO INDIVIDUAL
:: ================================================================
:start_infra
cls
%COLOR_INFO%🔧 Iniciando apenas a Infraestrutura...
docker compose up -d mongodb mongo-express redis rabbitmq
%COLOR_SUCCESS%✅ Infraestrutura iniciada!
echo    - MongoDB:         mongodb://localhost:27017
echo    - Mongo Express:   http://localhost:8089
echo    - Redis:           redis://localhost:6379
echo    - RabbitMQ:        http://localhost:15672
goto end

:start_architecture
cls
%COLOR_INFO%🏗️  Iniciando a Arquitetura (Eureka + Gateway)...
echo.
%COLOR_INFO%Iniciando Eureka Server...
docker compose up -d eureka
call :wait_for_service eureka 30
echo.
%COLOR_INFO%Iniciando API Gateway...
docker compose up -d gateway
%COLOR_SUCCESS%✅ Arquitetura iniciada!
echo    - Eureka Server:   http://localhost:8761
echo    - API Gateway:     http://localhost:8080
goto end

:start_app_microservices
cls
%COLOR_INFO%🚀 Iniciando Microsservicos da Aplicacao...
call :check_service_running eureka
if %errorlevel% neq 0 (
    %COLOR_WARNING%Eureka Server nao esta em execucao. Iniciando primeiro...
    docker compose up -d eureka
    call :wait_for_service eureka 30
)
echo.
%COLOR_INFO%Iniciando backend, lmsfavorite, lmsrating, lms-email-service...
docker compose up -d backend lmsfavorite lmsrating lms-email-service
%COLOR_SUCCESS%✅ Microsservicos da aplicacao iniciados!
echo    - Backend Principal: http://localhost:8081
echo    - Servico de Favoritos: http://localhost:8083
echo    - Servico de Avaliacoes: http://localhost:8082
echo    - Servico de Email: http://localhost:8084
goto end

:start_frontend
cls
%COLOR_INFO%🌐 Iniciando apenas o Frontend...
docker compose up -d frontend
%COLOR_SUCCESS%✅ Frontend iniciado!
echo    - Frontend (Next.js): http://localhost:3000
goto end


:: ================================================================
:: RECONSTRUIR (BUILD)
:: ================================================================
:rebuild_backend
cls
%COLOR_INFO%🔄 Reconstruindo API Principal (lmsfilmes)...
docker compose stop backend
docker compose build --no-cache backend
docker compose up -d backend
%COLOR_SUCCESS%✅ API Principal reconstruida e iniciada!
goto end

:rebuild_gateway
cls
%COLOR_INFO%🔄 Reconstruindo API Gateway...
docker compose stop gateway
docker compose build --no-cache gateway
docker compose up -d gateway
%COLOR_SUCCESS%✅ API Gateway reconstruido e iniciado!
goto end

:rebuild_microservices
cls
%COLOR_INFO%🔄 Reconstruindo Microsservicos (Favorite, Rating, Email)...
docker compose stop lmsfavorite lmsrating lms-email-service
docker compose build --no-cache lmsfavorite lmsrating lms-email-service
docker compose up -d lmsfavorite lmsrating lms-email-service
%COLOR_SUCCESS%✅ Microsservicos reconstruidos e iniciados!
goto end

:rebuild_frontend
cls
%COLOR_INFO%🔄 Reconstruindo Frontend...
docker compose stop frontend
docker compose build --no-cache frontend
docker compose up -d frontend
%COLOR_SUCCESS%✅ Frontend reconstruido e iniciado!
goto end


:: ================================================================
:: UTILITARIOS
:: ================================================================
:check_status
cls
%COLOR_INFO%📊 Status dos Containers Docker:
docker compose ps
goto end

:logs
cls
%COLOR_INFO%📋 Visualizar logs de um servico:
echo.
docker compose ps --services
echo.
set /p log_choice="Digite o nome do servico para ver os logs (ou deixe em branco para cancelar): "
if "%log_choice%"=="" goto menu
cls
docker compose logs -f %log_choice%
goto end

:mongo_cli
cls
%COLOR_INFO%🗄️  Conectando ao MongoDB CLI...
docker compose exec mongodb mongosh -u admin -p admin123 --authenticationDatabase admin
goto end

:redis_cli
cls
%COLOR_INFO%🔴 Conectando ao Redis CLI...
docker compose exec redis redis-cli
goto end

:rabbitmq_management
cls
%COLOR_INFO%🐰 Abrindo RabbitMQ Management UI...
echo    Usuario: admin
echo    Senha:   admin123
start http://localhost:15672
goto end


:: ================================================================
:: SECOES DE FINALIZACAO
:: ================================================================
:print_urls
echo.
%COLOR_INFO%🔗 URLs principais disponiveis:
echo    - Frontend (Next.js):       http://localhost:3000
echo    - API Gateway (Entrada):    http://localhost:8080
echo    - Eureka Server:            http://localhost:8761
echo    - RabbitMQ Management:      http://localhost:15672
echo    - Mongo Express:            http://localhost:8089
goto :eof

:end
echo.
echo Pressione qualquer tecla para voltar ao menu...
pause >nul
goto menu

:exit
cls
%COLOR_SUCCESS%👋 Saindo do Docker Manager...
timeout /t 1 /nobreak >nul
exit