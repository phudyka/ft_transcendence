FROM prom/prometheus:v2.52.0

COPY config/prometheus.yml /etc/prometheus/

COPY config/alert_rules.yml /etc/prometheus/

RUN chmod -R 777 /prometheus