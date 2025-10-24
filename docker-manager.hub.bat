@echo off
title Gerenciador Docker Compose

:menu
cls
echo ===============================================
echo  GERENCIADOR DOCKER COMPOSE
echo ===============================================
echo.
echo  1. Iniciar Servicos (docker-compose up -d)
echo  2. Parar Servicos (docker-compose down)
echo  3. Sair
echo.
echo ===============================================
echo.

set /p choice="Escolha uma opcao (1, 2 ou 3): "

if "%choice%"=="1" goto start
if "%choice%"=="2" goto stop
if "%choice%"=="3" goto exit

echo Opcao invalida. Pressione qualquer tecla para tentar novamente.
pause > nul
goto menu

:start
cls
echo Iniciando todos os servicos em modo detached (-d)...
echo.
docker-compose -f "docker-compose.hub.yml" up -d --build
echo.
echo ===============================================
echo  Servicos iniciados!
echo  Pressione qualquer tecla para voltar ao menu.
echo ===============================================
pause > nul
goto menu

:stop
cls
echo Parando e removendo todos os servicos...
echo.
docker-compose -f "docker-compose.hub.yml" down
echo.
echo ===============================================
echo  Servicos parados!
echo  Pressione qualquer tecla para voltar ao menu.
echo ===============================================
pause > nul
goto menu

:exit
exit