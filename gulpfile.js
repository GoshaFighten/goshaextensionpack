const fs = require('fs');
const gulp = require('gulp');
const through = require('through2');
var exec = require('shelljs.exec');

const pathToReadme = 'README.md';
const pathToPackageJSON = 'package.json';

gulp.task('default', async () => {
  const packageJSON = fs.readFileSync(pathToPackageJSON);
  const packages = JSON.parse(packageJSON).extensionPack;
  const urls = packages.map(package => getPackageUrls(package));
  const promises = urls.map(url => fetchPackageInfo(url));
  const data = await Promise.all(promises);
  const sortedPackages = data.sort((a, b) => {
    var keyA = a.displayName,
      keyB = b.displayName;
    if (keyA < keyB) return -1;
    if (keyA > keyB) return 1;
    return 0;
  });
  return gulp
    .src(pathToReadme)
    .pipe(createReadme(sortedPackages))
    .pipe(gulp.dest('./'));
});

function fetchPackageInfo(url) {
  return new Promise((resolve, reject) => {
    const command = `vsce show ${url.name} --json`;
    const result = exec(command);
    if (!result.stdout) {
      console.log(`${url.name} package not found`);
      reject(url.name);
      return;
    }
    const packageInfo = JSON.parse(result.stdout);
    resolve({
      displayName: packageInfo.displayName,
      description: packageInfo.shortDescription,
      name: url.name,
      image: url.imageUrl
    });
  });
}

function getPackageUrls(package) {
  return {
    url: getPackageUrl(package),
    imageUrl: getPackageImageUrl(package),
    name: package
  };
}

function getPackageUrl(package) {
  return getPackageUrlCore(package, 'Microsoft.VisualStudio.Code.Manifest');
}

function getPackageImageUrl(package) {
  return getPackageUrlCore(
    package,
    'Microsoft.VisualStudio.Services.Icons.Default'
  );
}

function getPackageUrlCore(package, resourse) {
  const packageInfos = package.split('.');
  const publisher = packageInfos[0];
  const name = packageInfos[1];
  return `https://ms.gallery.vsassets.io/_apis/public/gallery/publisher/${publisher}/extension/${name}/latest/assetbyname/${resourse}`;
}

function createReadme(packageInfos) {
  return through.obj((file, enc, cb) => {
    const transformedFile = file.clone();
    const content = packageInfos.map(pi => renderTableRow(pi)).join('\r\n');
    transformedFile.contents = new Buffer(
      renderHeader() + renderTableHeader() + content
    );
    cb(null, transformedFile);
  });
}

function renderTableRow(packageInfo) {
  return `|<img src="${packageInfo.image}" width="64">|[${
    packageInfo.displayName
  }](https://marketplace.visualstudio.com/items?itemName=${
    packageInfo.name
  })<br>*${packageInfo.description}*|`;
}

function renderTableHeader() {
  return `
  |Logo|Name|
  |---|---|
  `;
}

function renderHeader() {
  return `# Gosha's VSCode Extensions
List of extensions:
    `;
}
