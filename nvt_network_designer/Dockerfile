ARG BUILD_VERSION=0.3.1
ARG BUILD_ARCH=aarch64

FROM node:22-alpine AS frontend-build
WORKDIR /build/frontend
COPY frontend/package*.json ./
RUN npm install
COPY frontend/ ./
RUN npm run build

FROM python:3.12-slim

ARG BUILD_VERSION
ARG BUILD_ARCH

ENV NVT_APP_VERSION="${BUILD_VERSION}"

LABEL io.hass.version="${BUILD_VERSION}" \
      io.hass.type="app" \
      io.hass.arch="${BUILD_ARCH}"

RUN pip install --no-cache-dir \
        fastapi==0.116.1 \
        uvicorn==0.35.0 \
        pydantic==2.11.7 \
        paho-mqtt==2.1.0

WORKDIR /app
COPY backend/ /app/backend/
COPY --from=frontend-build /build/frontend/dist /app/backend/static

ENV PYTHONUNBUFFERED=1
EXPOSE 8099

CMD ["python", "-m", "uvicorn", "backend.main:app", "--host", "0.0.0.0", "--port", "8099", "--proxy-headers"]
