import mariadb from 'mariadb';

const pool = mariadb.createPool({
    host: 'localhost',
    port: 3306,
    user: 'root',
    password: 'super dooper good pw',
    database: 'txid',
})

export async function getConnection() {
    return await pool.getConnection();
  }

  
