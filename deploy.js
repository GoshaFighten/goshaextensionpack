const releaseIt = require('release-it');
var exec = require('shelljs.exec');
const options = {
  git: {
    tagName: 'v${version}',
    requireCleanWorkingDir: false,
    requireUpstream: false
  },
  github: {
    release: true,
    assets: ['./*.vsix']
  },
  npm: {
    publish: false
  },
  scripts: {
    beforeStage: 'vsce ls --yarn && vsce package --yarn'
  },
  increment: 'minor'
};

const result1 = exec('git show HEAD:package.json');
const config1 = JSON.parse(result1.stdout);
delete config1['version'];

const latestTag = exec('git describe --abbrev=0').stdout.replace(
  /(\r\n|\n|\r)/gm,
  ''
);

let config2;
if (latestTag) {
  const result2 = exec(`git show ${latestTag}:package.json`);
  config2 = JSON.parse(result2.stdout);
  delete config2['version'];
} else {
  config2 = '';
}

if (JSON.stringify(config1) != JSON.stringify(config2)) {
  releaseIt(options).then(output => {
    console.log(output);
  });
}
