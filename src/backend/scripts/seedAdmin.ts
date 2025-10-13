import 'dotenv/config';                 //
import { getDb } from '../src/config/db';  //
import bcrypt from 'bcrypt';

(async () => {
  const pool = getDb();
  const email = 'admin@visicontrol.dev';
  const name = 'Administrador';
  const passwordHash = await bcrypt.hash('Admin123!', 10);
  await pool.query(
    "INSERT INTO users(name,email,password_hash,role) VALUES($1,$2,$3,'ADMIN') ON CONFLICT (email) DO NOTHING",
    [name, email, passwordHash]
  );
  console.log('Admin listo:', email, '/ Admin123!');
  process.exit(0);
})();

