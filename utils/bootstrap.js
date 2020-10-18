const {existsSync, mkdirSync, rmdirSync, statSync, writeFile} = require('fs');
const {join, resolve} = require('path');

const {log, error} = require('essential-md');

const {PORT = 8080} = process.env;

const argv = process.argv.slice(2);
const help = argv.length !== 1 || /^(?:-h|--help)$/.test(argv[0]);
if (help || !existsSync(argv[0]) || !statSync(argv[0]).isDirectory()) {
  log`
# life-diary ❤️ 
 -your albums, your journey, your data-

 **usage**

  \`life-diary ./destination-folder\`
`;
  if (!help)
    error(`invalid folder ${argv[0]}\n`);
  process.exit(help ? 0 : 1);
}

const FOLDER = resolve(argv[0]);
const TMP = join(FOLDER, '.tmp');

if (existsSync(TMP))
  rmdirSync(TMP, {recursive: true});

if (!existsSync(join(FOLDER, '.gitignore')))
  writeFile(join(FOLDER, '.gitignore'), '.DS_Store\n.tmp/', Object);

module.exports = {FOLDER, TMP, PORT};
