FROM rust:1.59.0 as builder

RUN user=root cargo new server
WORKDIR /server
COPY ./Cargo.toml ./Cargo.toml
RUN cargo build --release
RUN rm src/*.rs

ADD . ./

RUN rm ./target/release/deps/server*
RUN cargo build --release

FROM debian:buster-slim
ARG APP=/usr/src/app

ARG PORT
ARG FRONTEND_URL
ARG DATABASE_URL
ARG REFRESH_TOKEN_SECRET
ARG ACCESS_TOKEN_SECRET
ARG GOOGLE_CLIENT_ID
ARG GOOGLE_CLIENT_SECRET
ARG CLOUDINARY_API_KEY
ARG CLOUDINARY_API_SECRET

RUN apt-get update \
	&& apt-get -y install libpq-dev \
	&& apt-get install -y ca-certificates tzdata \
	&& rm -rf /var/lib/apt/lists/*

ENV TZ=Etc/UTC \
	APP_USER=appuser

RUN groupadd $APP_USER \
	&& useradd -g $APP_USER $APP_USER \
	&& mkdir -p ${APP}

COPY --from=builder /server/target/release/server /server/migrations /server/emoji_map.json ${APP}/

RUN chown -R $APP_USER:$APP_USER ${APP}

USER $APP_USER

WORKDIR ${APP}

CMD ["./server"]