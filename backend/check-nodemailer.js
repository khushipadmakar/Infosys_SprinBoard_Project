const nodemailer = require('nodemailer');

console.log('Nodemailer loaded:', !!nodemailer);
console.log('createTransport exists:', !!nodemailer.createTransport);
console.log('Nodemailer version:', nodemailer);

if (nodemailer.createTransport) {
  console.log('✅ Nodemailer is working correctly!');
} else {
  console.log('❌ Nodemailer createTransport not found!');
}