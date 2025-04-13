const bcrypt = require('bcrypt');

const plainPassword = 'Admin!2025#david';
const saltRounds = 10;

async function createHashedPassword() {
  const hash = await bcrypt.hash(plainPassword, saltRounds);
  console.log('Plain password:', plainPassword);
  console.log('Hashed password:', hash);
}

createHashedPassword();
