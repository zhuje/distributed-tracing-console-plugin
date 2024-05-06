FROM registry.redhat.io/ubi8/nodejs-16:1-72 AS web-builder

WORKDIR /opt/app-root

USER 0

COPY web/package*.json web/
COPY Makefile Makefile

ENTRYPOINT ["tail", "-f", "/dev/null"]
