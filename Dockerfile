FROM python:3.12-slim
WORKDIR /app
COPY requirements.txt ./
# 가상환경 활성화 후 패키지 설치
RUN pip install --no-cache-dir -r requirements.txt
COPY app ./
EXPOSE 8000
# uvicorn을 사용하여 FastAPI 애플리케이션 실행
CMD ["uvicorn", "app:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]
