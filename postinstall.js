const fs = require('fs');
const path = require('path');

const envExampleFilePath = path.resolve(__dirname, '_env.example');
const envFilePath = path.resolve(__dirname, '.env');

if (!fs.existsSync(envFilePath) && fs.existsSync(envExampleFilePath)) {
  fs.copyFileSync(envExampleFilePath, envFilePath);
}