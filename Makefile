.PHONY: help install build backend frontend dev clean free-port docker-up

BACKEND  := backend
FRONTEND := frontend

help:
	@echo "GuardSim — цели Makefile:"
	@echo ""
	@echo "  make install    Установить зависимости (Maven compile + npm install)"
	@echo "  make dev        Освобождает :8080, затем API и Vite (нужен PostgreSQL на localhost:5432; см. docker compose up -d postgres)"
	@echo "  make free-port  Завершить процессы, слушающие TCP 8080 (старый Java и т.п.)"
	@echo "  make backend    Только Spring Boot (:8080)"
	@echo "  make frontend   Только фронтенд (прокси /api → 8080)"
	@echo "  make build      Сборка бэкенда и production-бандла фронтенда"
	@echo "  make clean      mvn clean и удаление $(FRONTEND)/dist"
	@echo "  make docker-up  Сборка и запуск через Docker Compose: PostgreSQL + API + web (см. .env.example)"
	@echo ""
	@echo "Перед первым запуском: make install"
	@echo "Docker: cp .env.example .env, задайте GUARDSIM_JWT_SECRET и POSTGRES_PASSWORD, затем: docker compose up --build"

install:
	cd $(BACKEND) && mvn -q -DskipTests compile 
	cd $(FRONTEND) && npm install

build:
	cd $(BACKEND) && mvn -q -DskipTests package
	cd $(FRONTEND) && npm ci
	cd $(FRONTEND) && npm run build

backend:
	cd $(BACKEND) && mvn spring-boot:run

frontend:
	cd $(FRONTEND) && npm run dev

# macOS и Linux: освобождает порт 8080, чтобы новый экземпляр Spring Boot мог стартовать
free-port:
	@pids=$$(lsof -tiTCP:8080 -sTCP:LISTEN 2>/dev/null || true); \
	if [ -n "$$pids" ]; then \
	  echo "Порт 8080 занят (PID: $$pids). Завершаю процесс(ы)…"; \
	  kill -15 $$pids 2>/dev/null || true; \
	  sleep 2; \
	  pids=$$(lsof -tiTCP:8080 -sTCP:LISTEN 2>/dev/null || true); \
	  if [ -n "$$pids" ]; then \
	    echo "Принудительное завершение (SIGKILL)…"; \
	    kill -9 $$pids 2>/dev/null || true; \
	  fi; \
	fi

dev: free-port
	@bash -c 'set -e; \
		trap "kill 0" INT TERM; \
		echo "Запуск Spring Boot (первый раз Maven может качать зависимости 1–2 мин)…"; \
		(cd "$(BACKEND)" && mvn spring-boot:run) & \
		echo "Ожидание http://127.0.0.1:8080/api/scenarios …"; \
		ok=0; i=0; \
		while [ "$$i" -lt 180 ]; do \
		  if curl -sf -H "X-GuardSim-Player: 00000000-0000-0000-0000-000000000099" -H "X-GuardSim-Demo: 1" "http://127.0.0.1:8080/api/scenarios" >/dev/null 2>&1; then ok=1; break; fi; \
		  i=$$((i+1)); sleep 1; \
		done; \
		if [ "$$ok" != 1 ]; then echo "Ошибка: API не поднялся за 3 мин. Проверьте: cd $(BACKEND) && mvn spring-boot:run"; kill 0; exit 1; fi; \
		echo "API готов. Запуск Vite (см. порт в логе npm, часто 5173)…"; \
		(cd "$(FRONTEND)" && npm run dev) & \
		wait'

clean:
	cd $(BACKEND) && mvn clean
	rm -rf $(FRONTEND)/dist

docker-up:
	docker compose up --build
