require('dotenv').config();

console.log('🔍 DEBUG .ENV\n');
console.log('OPENAI_API_KEY existe?', !!process.env.OPENAI_API_KEY);
console.log('Tamanho:', process.env.OPENAI_API_KEY?.length, 'caracteres');
console.log('Primeiros 20 chars:', process.env.OPENAI_API_KEY?.substring(0, 20));
console.log('Últimos 10 chars:', process.env.OPENAI_API_KEY?.slice(-10));
console.log('Começa com sk-proj-?', process.env.OPENAI_API_KEY?.startsWith('sk-proj-'));
console.log('Tem espaços?', process.env.OPENAI_API_KEY?.includes(' '));
console.log('Tem quebra de linha?', process.env.OPENAI_API_KEY?.includes('\n'));