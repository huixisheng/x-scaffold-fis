const fis = require('fis3');
const config = require('x-config-deploy').getConfig();
const path = require('path');

const resourcesReplace = [
  // img0支持https
  fis.plugin('replace', {
    from: /http:\/\/static/ig,
    to: '//img0',
  }),
  fis.plugin('replace', {
    from: /\/\/static/ig,
    to: '//img0',
  }),
  // p.cosmeapp.com 支持https
  fis.plugin('replace', {
    from: /http:\/\/public/ig,
    to: '//p',
  }),
  // 支持https
  fis.plugin('replace', {
    from: /http:\/\//ig,
    to: '//',
  }),
];

const pushServer = [
  fis.plugin('http-push2', {
    receiver: config['urlUpload'],
    to: config['pathAssets'],
    cacheDir: process.cwd() + '/.cache',
  }),
];

const localDeliver = [
  fis.plugin('local-deliver', {
    to: config['mapCosmeapi'],
  }),
];


const _ = require('underscore');

let deployConfig = _.clone(resourcesReplace);
deployConfig = deployConfig.concat(pushServer);
let deployMap = _.clone(resourcesReplace);
deployMap = deployMap.concat(localDeliver);


// 用于配置局域网实时预览
fis.config.set('livereload-iprule', '192.168.*.*');
fis.set('project.files', ['*.html', '*.md', '*.json', '*.conf', '*.php']);
fis.set('project.ignore', ['node_modules/**', 'output/**', 'fis-conf.js', 'dist/**', 'build/**', 'config/*.js', 'package.json', 'LICENSE', 'server.log']);

// html文件压缩配置
fis.set('settings.optimizer.html-minifier', {
  removeComments: true,
  minifyJS: true,
  collapseWhitespace: true,
  minifyCSS: true,
});

// https://github.com/fex-team/fis-spriter-csssprites
fis.config.set('settings.spriter.csssprites', {
  scale: 0.5,
  layout: 'matrix',
  margin: 10,
});

// 解析md文件
fis.match('README.md', {
  parser: fis.plugin('marked-template'),
  useCache: false,
  release: '/readme.html',
  rExt: '.html',
});

// mock 配置
// fis.match('/mock/server.conf', {
//   release: '/test/server.conf'
// });


// css代码检测
const csslintConf = {
  // ignoreFiles: ['css/myignore.css'],
  rules: {
    'known-properties': 2,
  },
};

fis.match('css/*.css', {
  lint: fis.plugin('csslint', csslintConf),
});

// https://www.npmjs.com/package/fis3-lint-eslint
const eslintConf = {
  ignoreFiles: ['js/lib/**.js', 'js-conf.js'],
  envs: ['browser', 'node'],
  globals: ['$'],
  rules: {
    // "semi": [1],
    // "no-undef": [2]
    // "no-use-before-define": [1],
    // "no-unused-vars": [1],
    // "no-eval": [1]
  },
};

fis.match('js/*.js', {
  lint: fis.plugin('eslint', eslintConf),
});


// config with inline rules
// https://www.npmjs.com/package/fis3-lint-htmlhint
const htmlhintConf = {
  // rules: {
  //   "tagname-lowercase": true,
  //   "attr-lowercase": true,
  //   "attr-value-double-quotes": true,
  //   "doctype-first": true,
  //   "tag-pair": true,
  //   "spec-char-escape": true,
  //   "id-unique": true,
  //   "src-not-empty": true,
  //   "attr-no-duplication": true,
  //   "title-require": true
  // }
};
fis.match('page/*.html', {
  lint: fis.plugin('htmlhint', htmlhintConf),
});


// 启用 fis-spriter-csssprites 插件
fis.match('::package', {
  spriter: fis.plugin('csssprites'),
});

fis.match('{**.css,*.html:css}', {
  useMap: false,
  postprocessor: fis.plugin('autoprefixer', {
    // https://github.com/ai/browserslist#queries
    // 'Explorer >= 9',
    browsers: ['Firefox >= 20', 'Safari >= 6', 'Chrome >= 12', 'ChromeAndroid >= 4.0'],
    flexboxfixer: true,
    gradientfixer: true,
  }),
});

const cacheDir = path.join(path.dirname(__dirname), '.cache');


// 资源配置
const resourcesConfig = {
  // 图片上传七牛
  image: {
    // 压缩图片
    // https://tinyjpg.com/
    // var tinifycache = path.join(cmd['userHome'], '.tinifycache');
    // https://github.com/zswang/fis-optimizer-tinify
    optimizer: fis.plugin('tinify', {
      key: config['tinifyKey'],
      cacheDir,
    }),
    useHash: true,
    useMap: false,
    domain: config['qiniuDomain'],
    deploy: fis.plugin('qiniu', config['qiniuConfig']),
  },
  // css上传资源服务器
  css: {
    optimizer: fis.plugin('clean-css'),
    domain: config['urlAssets'],
    useHash: true,
    useMap: true,
    deploy: deployConfig,
  },
  // css上传资源服务器
  js: {
    optimizer: fis.plugin('uglify-js'),
    domain: config['urlAssets'],
    useHash: true,
    useMap: true,
    deploy: deployConfig,
  },
  map: {
    deploy: deployMap,
  },
};


function inti() {
  fis
    .media('pro')
    // 压缩*.html内联的js
    .match('{**.js,*.html:js}', resourcesConfig.js)
    // 压缩*.html内联的js
    .match('{**.css,*.html:css}', resourcesConfig.css)
    .match('*.{png,jpg,gif}', resourcesConfig.image)
    .match('map.json', resourcesConfig.map)
    .match('/node_modules/**.js', {
      useMap: false,
    });
}

exports.resourcesConfig = resourcesConfig;
exports.resourcesReplace = resourcesReplace;
exports.pushServer = pushServer;
exports.init = inti;