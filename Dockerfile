# Используем официальный легкий образ Python
FROM python:3.10-slim

# Устанавливаем рабочую директорию внутри контейнера
WORKDIR /app

# Копируем файл зависимостей
COPY requirements.txt .

# Устанавливаем все библиотеки Python
RUN pip install --no-cache-dir -r requirements.txt

# Копируем весь остальной код бэкенда в контейнер
COPY . .

# Открываем порт 8080 для связи
EXPOSE 8080

# Команда для запуска сервера uvicorn внутри Docker
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8080"]
