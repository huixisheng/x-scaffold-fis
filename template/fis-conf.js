const fisConfig = require('./config/fis-base.js');
// const projectPath = fis.project.getProjectPath();

fisConfig.init();

// 自定义map.json名字
fis.match('map.json', {
  release: '/map-{{name}}.json',
});