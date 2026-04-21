// Quick test to verify password hashing
const bcrypt = require('bcryptjs');

async function test() {
    const plainPassword = 'FBEProctorPass12026!';
    const hash = await bcrypt.hash(plainPassword, 12);

    console.log('Plain:', plainPassword);
    console.log('Hash:', hash);

    const match = await bcrypt.compare(plainPassword, hash);
    console.log('Match:', match);
}

test();
