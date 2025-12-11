require('dotenv').config({ path: '.env.local' });

const axios = require('axios');

async function testAuth() {
  const BASE_URL = 'http://localhost:3000/api/auth';
  
  console.log('🧪 Teste de Autenticação\n');

  try {
    // 1. SIGNUP
    console.log('1️⃣ Testando SIGNUP...');
    const signupRes = await axios.post(`${BASE_URL}/signup`, {
      email: 'teste2@scopsy.com.br',
      password: 'senha123456',
      name: 'Usuário Teste',
      crp: '12/34567'
    });

    console.log('✅ Signup OK!');
    console.log('User:', signupRes.data.user);
    console.log('Token:', signupRes.data.token.substring(0, 20) + '...');
    console.log('');

    const token = signupRes.data.token;

    // 2. LOGIN
    console.log('2️⃣ Testando LOGIN...');
    const loginRes = await axios.post(`${BASE_URL}/login`, {
      email: 'teste@scopsy.com.br',
      password: 'senha123456'
    });

    console.log('✅ Login OK!');
    console.log('User:', loginRes.data.user);
    console.log('');

    // 3. ME (dados do usuário)
    console.log('3️⃣ Testando GET /me...');
    const meRes = await axios.get(`${BASE_URL}/me`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    console.log('✅ Me OK!');
    console.log('User:', meRes.data.user);
    console.log('');

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ TODOS OS TESTES PASSARAM!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━');

  } catch (error) {
    console.error('❌ ERRO COMPLETO:');
    console.error('Message:', error.message);
    console.error('Response:', error.response?.data);
    console.error('Status:', error.response?.status);
    console.error('Stack:', error.stack);
  }
}

testAuth();