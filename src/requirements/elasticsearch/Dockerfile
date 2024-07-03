FROM debian:bullseye

WORKDIR /elasticsearch

RUN apt update && apt install -y wget &&\
    wget https://artifacts.elastic.co/downloads/elasticsearch/elasticsearch-8.14.1-linux-x86_64.tar.gz &&\
    tar -xf elasticsearch-8.14.1-linux-x86_64.tar.gz &&\
    mv elasticsearch-8.14.1/* /elasticsearch &&\
    rm -rf elasticsearch-8.14.1 elasticsearch-8.14.1-linux-x86_64.tar.gz



ENTRYPOINT [ "sleep", "infinity" ]