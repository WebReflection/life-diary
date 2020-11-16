const {execSync} = require('child_process');
const {existsSync, rmdirSync, statSync, readFileSync, writeFile} = require('fs');
const {join, resolve} = require('path');

const {log, error} = require('essential-md');

const {stringify} = JSON;

const MAP_SERVER = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
const MAP_ATTRIBUTION = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

let EXIF = '';
try { EXIF = execSync('exiftool -ver').toString().trim(); }
catch (e) {
  log`
# life-diary ❤️ 
 -your albums, your journey, your data-

 **exiftool required**

 Please install exiftool to use this software, thank you!
 -visit- https://exiftool.org/install.html
`;
  process.exit(1);
}

const argv = process.argv.slice(2);
const options = argv.filter(arg => /^--/.test(arg));
const paths = argv.filter(arg => !/^--/.test(arg));
const help = paths.length === 0 || options.includes('-h') || options.includes('--help');

const FOLDER = paths.length ? resolve(paths.shift()) : '';

if (help || !FOLDER || !existsSync(FOLDER) || !statSync(FOLDER).isDirectory()) {
  log`
# life-diary ❤️ 
 -your albums, your journey, your data-

 **usage**
  \`life-diary ./destination-folder\` -[options]-

 **options**
  \`-h | --help\`           -this help-
  \`--password=***\`        -basic realm to view/edit-
  \`--password-write=***\`  -basic realm to edit only-
  \`--map-server=***\`      -map tile server to use-
  \`--map-attribution=***\` -map attribution-
  \`--no-ffmpeg\`           -disable mov to mp4 convertion-

`;
  if (!help)
    error(`invalid folder ${FOLDER}\n`);
  process.exit(help ? 0 : 1);
}

const {PORT = 8080} = process.env;

const TMP = join(FOLDER, '.tmp');
if (existsSync(TMP))
  rmdirSync(TMP, {recursive: true, force: true});

if (!existsSync(join(FOLDER, '.gitignore')))
  writeFile(join(FOLDER, '.gitignore'), '.DS_Store\n.tmp/', Object);

let PASSWORD_READ = '';
if (options.some(arg => /^--password=(.+)$/.test(arg)))
  PASSWORD_READ = RegExp.$1;

let PASSWORD_WRITE = PASSWORD_READ;
if (!PASSWORD_WRITE && options.some(arg => /^--password-write=(.+)$/.test(arg)))
  PASSWORD_WRITE = RegExp.$1;

const mapDetails = [
  [/const MAP_SERVER\s*=.+/, `const MAP_SERVER = ${stringify(
      options.some(arg => /^--map-server=(.+)$/.test(arg)) ?
        RegExp.$1 :
        MAP_SERVER
  )};`],
  [/const MAP_ATTRIBUTION\s*=.+/, `const MAP_ATTRIBUTION = ${stringify(
      options.some(arg => /^--map-attribution=(.+)$/.test(arg)) ?
        RegExp.$1 :
        MAP_ATTRIBUTION
  )};`]
];

let FFMPEG = '';
if (!options.some(arg => '--no-ffmpeg' === arg)) {
  try { FFMPEG = execSync('ffmpeg -version').toString().replace(/^[\s\S]+? version ([^ ]+)[\s\S]+$/, '$1'); }
  catch (e) {}
}

const leaflet = join(__dirname, '..', 'public', 'js', 'leaflet.js');
writeFile(
  leaflet,
  readFileSync(leaflet).toString()
    .replace(...mapDetails[0])
    .replace(...mapDetails[1]),
  Object
);

module.exports = {EXIF, FFMPEG, FOLDER, TMP, PORT, PASSWORD_READ, PASSWORD_WRITE};
