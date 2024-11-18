import postgres from 'postgres';

const pgql = postgres('http://postgresql', {
    host                 : process.env.POSTGRES_HOST,            // Postgres ip address[s] or domain name[s]
    port                 : process.env.POSTGRES_PORT,          // Postgres server port[s]
    database             : 'users',            // Name of database to connect to
    username             : process.env.POSTGRES_USER,            // Username of database user
    password             : process.env.POSTGRES_PASSWORD,            // Password of database user
  });

export default pgql;