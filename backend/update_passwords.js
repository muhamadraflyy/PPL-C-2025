const bcrypt = require('bcrypt');
const mysql = require('mysql2/promise');

const passwords = {
  'freelancer1@example.com': 'Freelancer@2024!',
  'freelancer2@example.com': 'Freelancer@2024!',
  'client1@example.com': 'Client@2024!',
  'client2@example.com': 'Client@2024!',
  'admin@skillconnect.com': 'Admin@2024!'
};

async function updatePasswords() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'password',
    database: 'PPL_2025_C'
  });

  console.log('Connected to database');

  for (const [email, password] of Object.entries(passwords)) {
    const hash = await bcrypt.hash(password, 10);
    const [result] = await connection.execute(
      'UPDATE users SET password = ? WHERE email = ?',
      [hash, email]
    );
    console.log(`Updated password for ${email}: ${result.affectedRows} row(s)`);
  }

  await connection.end();
  console.log('All passwords updated successfully!');
}

updatePasswords().catch(console.error);
