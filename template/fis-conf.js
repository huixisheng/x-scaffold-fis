var path = require('path');
var _ = require('underscore');
var fisConfig = require('./config/fis-base.js');
var projectPath = fis.project.getProjectPath();

fisConfig.init();

// 自定义map.json名字
fis.match('map.json', {
  release: '/4.json'
});