@echo off
chcp 65001 >nul
cls

:menu
echo ===============================================
echo           LMS FILMS - DOCKER MANAGER
echo ===============================================
echo.
echo 🐳 Docker Services
echo   1 - Iniciar Stack Completo (MongoDB + Backend + Frontend + Redis + RabbitMQ)
echo   2 - Iniciar apenas Backend (MongoDB + API)
echo   3 - Iniciar apenas Frontend
echo   4 - Iniciar apenas MongoDB
echo   5 - Iniciar apenas Redis
echo   6 - Iniciar apenas RabbitMQ
echo   7 - Parar todos os serviços
echo   8 - Reconstruir aplicação completa
echo   9 - Reconstruir apenas Backend
echo  10 - Reconstruir apenas Frontend
echo  11 - Visualizar logs
echo  12 - Acessar MongoDB CLI
echo  13 - Acessar Redis CLI
echo  14 - Acessar RabbitMQ Management
echo.
echo 📊 Monitoramento
echo  15 - Verificar status dos containers
echo.
echo   0 - Sair
echo.
echo ===============================================

set /p choice=Escolha uma opcao: 

if "%choice%"=="1" goto start_full_stack
if "%choice%"=="2" goto start_backend
if "%choice%"=="3" goto start_frontend
if "%choice%"=="4" goto start_mongo
if "%choice%"=="5" goto start_redis
if "%choice%"=="6" goto start_rabbitmq
if "%choice%"=="7" goto stop_all
if "%choice%"=="8" goto rebuild_all
if "%choice%"=="9" goto rebuild_backend
if "%choice%"=="10" goto rebuild_frontend
if "%choice%"=="11" goto logs
if "%choice%"=="12" goto mongo_cli
if "%choice%"=="13" goto redis_cli
if "%choice%"=="14" goto rabbitmq_management
if "%choice%"=="15" goto check_status
if "%choice%"=="0" goto exit
goto invalid

:start_full_stack
echo 🚀 Iniciando Stack Completo (MongoDB + Backend + Frontend + Redis + RabbitMQ)...
docker-compose up -d
echo.
echo ✅ Stack completo iniciado!
echo 🔗 URLs disponíveis:
echo   🌐 Frontend: http://localhost:3000
echo   🚀 API Backend: http://localhost:8080
echo   📊 MongoDB: mongodb://localhost:27017
echo   🌐 Mongo Express: http://localhost:8081
echo   🔴 Redis: redis://localhost:6379
echo   🐰 RabbitMQ: amqp://localhost:5672
echo   🌐 RabbitMQ Management: http://localhost:15672 (admin/admin123)
echo.
goto end

:start_backend
echo 🔧 Iniciando Backend (MongoDB + API)...
docker-compose up -d mongodb mongo-express backend
echo.
echo ✅ Backend iniciado!
echo 🔗 URLs disponíveis:
echo   🚀 API Backend: http://localhost:8080
echo   📊 MongoDB: mongodb://localhost:27017
echo   🌐 Mongo Express: http://localhost:8081
echo.
goto end

:start_frontend
echo 🌐 Iniciando Frontend (Next.js)...
docker-compose up -d frontend
echo.
echo ✅ Frontend iniciado!
echo 🔗 URL disponível:
echo   🌐 Frontend: http://localhost:3000
echo.
goto end

:start_mongo
echo 📊 Iniciando apenas MongoDB...
docker-compose up -d mongodb mongo-express
echo.
echo ✅ MongoDB iniciado!
echo 🔗 URLs disponíveis:
echo   📊 MongoDB: mongodb://localhost:27017
echo   🌐 Mongo Express: http://localhost:8081
echo.
goto end

:start_redis
echo 🔴 Iniciando apenas Redis...
docker-compose up -d redis
echo.
echo ✅ Redis iniciado!
echo 🔗 URL disponível:
echo   🔴 Redis: redis://localhost:6379
echo.
goto end

:start_rabbitmq
echo 🐰 Iniciando apenas RabbitMQ...
docker-compose up -d rabbitmq
echo.
echo ✅ RabbitMQ iniciado!
echo 🔗 URLs disponíveis:
echo   🐰 RabbitMQ: amqp://localhost:5672
echo   🌐 RabbitMQ Management: http://localhost:15672 (admin/admin123)
echo.
goto end

:stop_all
echo ⏹️ Parando todos os serviços...
docker-compose down
echo.
echo ✅ Todos os serviços foram parados!
echo.
goto end

:rebuild_all
echo 🔄 Reconstruindo aplicação completa...
docker-compose down
docker-compose build --no-cache
docker-compose up -d
echo.
echo ✅ Aplicação completa reconstruída e iniciada!
echo.
goto end

:rebuild_backend
echo 🔄 Reconstruindo apenas o Backend...
docker-compose stop backend
docker-compose build --no-cache backend
docker-compose up -d backend
echo.
echo ✅ Backend reconstruído e iniciado!
echo.
goto end

:rebuild_frontend
echo 🔄 Reconstruindo apenas o Frontend...
docker-compose stop frontend
docker-compose build --no-cache frontend
docker-compose up -d frontend
echo.
echo ✅ Frontend reconstruído e iniciado!
echo.
goto end

:logs
echo 📋 Logs da aplicação:
echo ===============================================
echo Escolha qual serviço deseja ver os logs:
echo 1 - Frontend
echo 2 - Backend  
echo 3 - MongoDB
echo 4 - Mongo Express
echo 5 - Redis
echo 6 - RabbitMQ
echo 7 - Todos os serviços
echo.
set /p log_choice=Escolha: 

if "%log_choice%"=="1" docker-compose logs -f frontend
if "%log_choice%"=="2" docker-compose logs -f backend
if "%log_choice%"=="3" docker-compose logs -f mongodb
if "%log_choice%"=="4" docker-compose logs -f mongo-express
if "%log_choice%"=="5" docker-compose logs -f redis
if "%log_choice%"=="6" docker-compose logs -f rabbitmq
if "%log_choice%"=="7" docker-compose logs -f
goto end

:mongo_cli
echo 🗄️ Conectando ao MongoDB CLI...
docker exec -it lms-mongodb mongosh -u admin -p admin123 --authenticationDatabase admin
goto end

:redis_cli
echo 🔴 Conectando ao Redis CLI...
docker exec -it lms-redis redis-cli
goto end

:rabbitmq_management
echo 🐰 Abrindo RabbitMQ Management UI...
echo 🌐 Interface Web: http://localhost:15672
echo 👤 Usuário: admin
echo 🔑 Senha: admin123
echo.
echo Abrindo navegador...
start http://localhost:15672
goto end

:check_status
echo 📊 Status dos Containers Docker:
echo ===============================================
docker-compose ps
echo.
echo 📈 Uso de recursos:
docker stats --no-stream
echo.
goto end

:invalid
echo ❌ Opção inválida! Tente novamente.
goto end

:exit
echo 👋 Saindo do Docker Manager...
goto end

:end
echo.
echo 📝 Pressione qualquer tecla para voltar ao menu...
pause >nul
goto menu