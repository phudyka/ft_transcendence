SELECT 'CREATE DATABASE users'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'users')\gexec

\c users

DROP TABLE IF EXISTS user;

CREATE TABLE "user" (
  "uid" uuid NOT NULL
);