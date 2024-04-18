FROM registry.access.redhat.com/ubi8/nodejs-18:latest AS build
USER root
RUN command -v yarn || npm i -g yarn

ADD . /usr/src/app
WORKDIR /usr/src/app
RUN yarn install && yarn build

FROM registry.redhat.io/ubi9/go-toolset:1.20 as go-builder

WORKDIR /usr/src/app

COPY Makefile Makefile
COPY go.mod go.mod
COPY go.sum go.sum

RUN go mod download

COPY cmd/ cmd/
COPY pkg/ pkg/

RUN make build-backend

FROM registry.access.redhat.com/ubi8/nginx-120:latest

COPY --from=build /usr/src/app/dist /usr/share/nginx/html
COPY --from=go-builder /usr/src/app/plugin-backend /usr/src/app

USER 1001

ENTRYPOINT ["nginx", "-g", "daemon off;"]