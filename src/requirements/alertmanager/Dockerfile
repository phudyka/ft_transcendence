FROM debian:bullseye

RUN apt update && apt install wget -y

WORKDIR /alertmanager

RUN wget https://github.com/prometheus/alertmanager/releases/download/v0.27.0/alertmanager-0.27.0.linux-amd64.tar.gz -P /alertmanager/dl

RUN tar -xzf /alertmanager/dl/alertmanager-0.27.0.linux-amd64.tar.gz && rm -rf /alertmanager/dl && mv alertmanager-0.27.0.linux-amd64/* /alertmanager && rm -rf alertmanager-0.27.0.linux-amd64

COPY config/config.sh /alertmanager/config.sh

EXPOSE 9093

COPY /config/alertmanager.yml /alertmanager/alertmanager.yml

ENTRYPOINT ["/alertmanager/config.sh"]