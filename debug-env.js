require('dotenv').config();
console.log("Current working directory:", process.cwd());
console.log("Loading .env file...");

const key = process.env.OPENAI_API_KEY;
if (!key) {
    console.error("❌ OPENAI_API_KEY is undefined or empty.");
} else {
    console.log("✅ OPENAI_API_KEY found.");
    console.log("   First 7 chars:", key.substring(0, 7));
    console.log("   Length:", key.length);
    if (key.startsWith("sk-proj")) {
        console.log("   Format seems correct (starts with sk-proj).");
    } else {
        console.log("   ⚠️ Warning: Key does not start with sk-proj (It might be an old key or org key).");
    }
}
