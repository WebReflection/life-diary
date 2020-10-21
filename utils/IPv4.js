const {networkInterfaces} = require('os');
const {keys} = Object;

module.exports = () => {
  const IPv4 = [];
  const nis = networkInterfaces();
  for (const key of keys(nis)) {
    for (const {address, family} of nis[key]) {
      if (family === 'IPv4' && address !== '127.0.0.1')
        IPv4.push(address);
    }
  }
  return IPv4;
};
