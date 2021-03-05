// 借鉴以下文章：
// https://zhuanlan.zhihu.com/p/79799105?hmsr=toutiao.io
// https://segmentfault.com/a/1190000021454137?utm_source=tag-newest
// https://blog.csdn.net/juhaotian/article/details/81038747

/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
//   /!\ DO NOT MODIFY THIS FILE /!\
// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
//
// The only job of create-react-app is to init the repository and then
// forward all the commands to the local version of create-react-app.
//
// If you need to add a new command, please add it to the scripts/ folder.
//
// The only reason to modify this file is to add more warnings and
// troubleshooting information for the `create-react-app` command.
//
// Do not make breaking changes! We absolutely don't want to have to
// tell people to update their global version of create-react-app.
//
// Also be careful with new language features.
// This file must work on Node 10+.
//
// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
//   /!\ DO NOT MODIFY THIS FILE /!\
// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

'use strict';
// Node.js 提供的 https 模块
const https = require('https');
// 字符串样式模块
const chalk = require('chalk');
// Node.js 命令行界面的完整解决方案
const commander = require('commander');
// 用于解析域名
const dns = require('dns');
// 系统环境信息
const envinfo = require('envinfo');
// 提供衍生子进程的模块
const execSync = require('child_process').execSync;
// 文件系统的扩展
const fs = require('fs-extra');
// 将http请求转化为流输出
const hyperquest = require('hyperquest');
// 轻便、美观、友好的交互式提示模块
const prompts = require('prompts');
// os 模块提供了与操作系统相关的实用方法和属性
const os = require('os');
// 提供处理文件和目录路径的一些工具
const path = require('path');
// npm语义化版本管理工具
const semver = require('semver');
// 节点的spawn和spawnSync的跨平台解决方案
const spawn = require('cross-spawn');
// 生成临时文件和目录
const tmp = require('tmp');
// 打包和解包模块，不依赖于package.json
const unpack = require('tar-pack').unpack;
// url解析相关的模块
const url = require('url');
// 判断npm包名是否合法
/*
假设字符超过214
validate("eLaBorAtE-paCkAgE-with-mixed-case-and-more-than-214-characters");
{
  validForNewPackages: false, 新标准
  validForOldPackages: true, 旧标准
  warnings: [
    "name can no longer contain capital letters",
    "name can no longer contain more than 214 characters"
  ]
}
*/
const validateProjectName = require('validate-npm-package-name');

const packageJson = require('./package.json');

let projectName;

function init() {
  const program = new commander.Command(packageJson.name)
    // 设置版本
    .version(packageJson.version)
    // 可以为最顶层命令指定命令参数，尖括号（例如<required>）意味着必选，而方括号（例如[optional]）则代表可选
    .arguments('<project-directory>')
    .usage(`${chalk.green('<project-directory>')} [options]`)
    // 命令处理函数的参数，为该命令声明的所有参数，除此之外还会附加两个额外参数：一个是解析出的选项，另一个则是该命令对象自身。
    .action(name => {
      projectName = name;
    })
    // 定义选项，同时可以附加选项的简介
    .option('--verbose', 'print additional logs')
    .option('--info', 'print environment debug info')
    .option(
      '--scripts-version <alternative-package>',
      'use a non-standard version of react-scripts'
    )
    .option(
      '--template <path-to-template>',
      'specify a template for the created project'
    )
    .option('--use-npm')
    .option('--use-pnp')
    // 允许使用未知的选项
    .allowUnknownOption()
    // 监听命令和选项可以执行自定义函数
    .on('--help', () => {
      console.log(
        `    Only ${chalk.green('<project-directory>')} is required.`
      );
      console.log();
      console.log(
        `    A custom ${chalk.cyan('--scripts-version')} can be one of:`
      );
      console.log(`      - a specific npm version: ${chalk.green('0.8.2')}`);
      console.log(`      - a specific npm tag: ${chalk.green('@next')}`);
      console.log(
        `      - a custom fork published on npm: ${chalk.green(
          'my-react-scripts'
        )}`
      );
      console.log(
        `      - a local path relative to the current working directory: ${chalk.green(
          'file:../my-react-scripts'
        )}`
      );
      console.log(
        `      - a .tgz archive: ${chalk.green(
          'https://mysite.com/my-react-scripts-0.8.2.tgz'
        )}`
      );
      console.log(
        `      - a .tar.gz archive: ${chalk.green(
          'https://mysite.com/my-react-scripts-0.8.2.tar.gz'
        )}`
      );
      console.log(
        `    It is not needed unless you specifically want to use a fork.`
      );
      console.log();
      console.log(`    A custom ${chalk.cyan('--template')} can be one of:`);
      console.log(
        `      - a custom template published on npm: ${chalk.green(
          'cra-template-typescript'
        )}`
      );
      console.log(
        `      - a local path relative to the current working directory: ${chalk.green(
          'file:../my-custom-template'
        )}`
      );
      console.log(
        `      - a .tgz archive: ${chalk.green(
          'https://mysite.com/my-custom-template-0.8.2.tgz'
        )}`
      );
      console.log(
        `      - a .tar.gz archive: ${chalk.green(
          'https://mysite.com/my-custom-template-0.8.2.tar.gz'
        )}`
      );
      console.log();
      console.log(
        `    If you have any problems, do not hesitate to file an issue:`
      );
      console.log(
        `      ${chalk.cyan(
          'https://github.com/facebook/create-react-app/issues/new'
        )}`
      );
      console.log();
    })
    .parse(process.argv);

  // 打印环境调试信息
  if (program.info) {
    console.log(chalk.bold('\nEnvironment Info:'));
    console.log(
      `\n  current version of ${packageJson.name}: ${packageJson.version}`
    );
    console.log(`  running from ${__dirname}`);
    // 根据传入的所需配置参数的对象，返回配置信息
    return envinfo
      .run(
        {
          System: ['OS', 'CPU'],
          Binaries: ['Node', 'npm', 'Yarn'],
          Browsers: [
            'Chrome',
            'Edge',
            'Internet Explorer',
            'Firefox',
            'Safari',
          ],
          npmPackages: ['react', 'react-dom', 'react-scripts'],
          npmGlobalPackages: ['create-react-app'],
        },
        {
          duplicates: true,
          showNotFound: true,
        }
      )
      .then(console.log);
  }

  // 没有指定项目名称
  if (typeof projectName === 'undefined') {
    console.error('Please specify the project directory:');
    console.log(
      `  ${chalk.cyan(program.name())} ${chalk.green('<project-directory>')}`
    );
    console.log();
    console.log('For example:');
    console.log(
      `  ${chalk.cyan(program.name())} ${chalk.green('my-react-app')}`
    );
    console.log();
    console.log(
      `Run ${chalk.cyan(`${program.name()} --help`)} to see all options.`
    );
    process.exit(1);
  }

  // We first check the registry directly via the API, and if that fails, we try
  // the slower `npm view [package] version` command.
  //
  // This is important for users in environments where direct access to npm is
  // blocked by a firewall, and packages are provided exclusively via a private
  // registry.

  // 调用查看指令版本的API，失败了就使用npm view 查看
  checkForLatestVersion()
    .catch(() => {
      try {
        // 
        return execSync('npm view create-react-app version').toString().trim();
      } catch (e) {
        return null;
      }
    })
    .then(latest => {
      // semver.lt(v1, v2): v1 < v2 ? true : false;
      // 版本号过低 
      if (latest && semver.lt(packageJson.version, latest)) {
        console.log();
        console.error(
          chalk.yellow(
            `You are running \`create-react-app\` ${packageJson.version}, which is behind the latest release (${latest}).\n\n` +
              'We no longer support global installation of Create React App.'
          )
        );
        console.log();
        console.log(
          'Please remove any global installs with one of the following commands:\n' +
            '- npm uninstall -g create-react-app\n' +
            '- yarn global remove create-react-app'
        );
        console.log();
        console.log(
          'The latest instructions for creating a new app can be found here:\n' +
            'https://create-react-app.dev/docs/getting-started/'
        );
        console.log();
        process.exit(1);
      } else {
        createApp(
          projectName,
          program.verbose,
          program.scriptsVersion,
          program.template,
          program.useNpm,
          program.usePnp
        );
      }
    });
}

function createApp(name, verbose, version, template, useNpm, usePnp) {
  // 如果node版本满足给定范围，返回true
  const unsupportedNodeVersion = !semver.satisfies(process.version, '>=10');
  if (unsupportedNodeVersion) {
    console.log(
      chalk.yellow(
        `You are using Node ${process.version} so the project will be bootstrapped with an old unsupported version of tools.\n\n` +
          `Please update to Node 10 or higher for a better, fully supported experience.\n`
      )
    );
    // Fall back to latest supported react-scripts on Node 4
    version = 'react-scripts@0.9.x';
  }

  // 返回绝对路径，如果没有传入 path 片段，则 path.resolve() 会返回当前工作目录的绝对路径。
  // 从后向前，若字符以 / 开头，不会拼接到前面的路径；若以 ../ 开头，拼接前面的路径，且不含最后一节路径；若以 ./ 开头 或者没有符号 则拼接前面路径；
  // path.resolve([…paths])里的每个参数都类似在当前目录执行一个cd操作，从左到右执行，返回的是最后的当前目录
  // 参考：https://blog.csdn.net/kikyou_csdn/article/details/83150538
  const root = path.resolve(name);
  // 返回path的最后一部分
  // path.basename('/目录1/目录2/文件.html');
  // 返回: '文件.html'
  const appName = path.basename(root);

  checkAppName(appName);
  // 确保目录存在，不存在就创建一个
  fs.ensureDirSync(name);
  if (!isSafeToCreateProjectIn(root, name)) {
    process.exit(1);
  }
  console.log();

  console.log(`Creating a new React app in ${chalk.green(root)}.`);
  console.log();

  const packageJson = {
    name: appName,
    version: '0.1.0',
    private: true,
  };
  // 将packageJson内容写入package.json文件
  fs.writeFileSync(
    path.join(root, 'package.json'),
    JSON.stringify(packageJson, null, 2) + os.EOL
  );
  // 判断使用yarn还是npm
  const useYarn = useNpm ? false : shouldUseYarn();
  // 返回 Node.js 进程的当前工作目录
  const originalDirectory = process.cwd();
  // 切换当前工作目录
  process.chdir(root);
  if (!useYarn && !checkThatNpmCanReadCwd()) {
    process.exit(1);
  }

  // 使用npm
  if (!useYarn) {
    const npmInfo = checkNpmVersion();
    if (!npmInfo.hasMinNpm) {
      if (npmInfo.npmVersion) {
        console.log(
          chalk.yellow(
            `You are using npm ${npmInfo.npmVersion} so the project will be bootstrapped with an old unsupported version of tools.\n\n` +
              `Please update to npm 6 or higher for a better, fully supported experience.\n`
          )
        );
      }
      // Fall back to latest supported react-scripts for npm 3
      version = 'react-scripts@0.9.x';
    }
  } else if (usePnp) {
    const yarnInfo = checkYarnVersion();
    if (yarnInfo.yarnVersion) {
      // 低版本无法支持pnp
      if (!yarnInfo.hasMinYarnPnp) {
        console.log(
          chalk.yellow(
            `You are using Yarn ${yarnInfo.yarnVersion} together with the --use-pnp flag, but Plug'n'Play is only supported starting from the 1.12 release.\n\n` +
              `Please update to Yarn 1.12 or higher for a better, fully supported experience.\n`
          )
        );
        // 1.11 had an issue with webpack-dev-middleware, so better not use PnP with it (never reached stable, but still)
        usePnp = false;
      }
      // 高版本默认支持pnp，主动使用该参数会中断
      if (!yarnInfo.hasMaxYarnPnp) {
        console.log(
          chalk.yellow(
            'The --use-pnp flag is no longer necessary with yarn 2 and will be deprecated and removed in a future release.\n'
          )
        );
        // 2 supports PnP by default and breaks when trying to use the flag
        usePnp = false;
      }
    }
  }

  // 使用yarn,检查yarn的镜像地址
  if (useYarn) {
    let yarnUsesDefaultRegistry = true;
    try {
      yarnUsesDefaultRegistry =
        execSync('yarnpkg config get registry').toString().trim() ===
        'https://registry.yarnpkg.com';
    } catch (e) {
      // ignore
    }
    // 如果使用yarn默认的镜像地址，复制yarn.lock.cached内容到yarn.lock
    if (yarnUsesDefaultRegistry) {
      fs.copySync(
        require.resolve('./yarn.lock.cached'),
        path.join(root, 'yarn.lock')
      );
    }
  }

  run(
    root,
    appName,
    version,
    verbose,
    originalDirectory,
    template,
    useYarn,
    usePnp
  );
}
// 判断是否可以使用yarn,即是否安装yarn,'yarn --version'亦可
function shouldUseYarn() {
  try {
    execSync('yarnpkg --version', { stdio: 'ignore' });
    return true;
  } catch (e) {
    return false;
  }
}

function install(root, useYarn, usePnp, dependencies, verbose, isOnline) {
  // 拼接指令安装指定的依赖
  return new Promise((resolve, reject) => {
    let command;
    let args;
    if (useYarn) {
      command = 'yarnpkg';
      args = ['add', '--exact'];
      if (!isOnline) {
        args.push('--offline');
      }
      if (usePnp) {
        args.push('--enable-pnp');
      }
      [].push.apply(args, dependencies);

      // Explicitly set cwd() to work around issues like
      // https://github.com/facebook/create-react-app/issues/3326.
      // Unfortunately we can only do this for Yarn because npm support for
      // equivalent --prefix flag doesn't help with this issue.
      // This is why for npm, we run checkThatNpmCanReadCwd() early instead.
      args.push('--cwd');
      args.push(root);

      if (!isOnline) {
        console.log(chalk.yellow('You appear to be offline.'));
        console.log(chalk.yellow('Falling back to the local Yarn cache.'));
        console.log();
      }
    } else {
      command = 'npm';
      args = [
        'install',
        '--save',
        '--save-exact',
        '--loglevel',
        'error',
      ].concat(dependencies);

      if (usePnp) {
        console.log(chalk.yellow("NPM doesn't support PnP."));
        console.log(chalk.yellow('Falling back to the regular installs.'));
        console.log();
      }
    }

    if (verbose) {
      args.push('--verbose');
    }
    const child = spawn(command, args, { stdio: 'inherit' });
    // 指令执行完的回调
    child.on('close', code => {
      if (code !== 0) {
        reject({
          command: `${command} ${args.join(' ')}`,
        });
        return;
      }
      resolve();
    });
  });
}

function run(
  root,
  appName,
  version,
  verbose,
  originalDirectory,
  template,
  useYarn,
  usePnp
) {
  Promise.all([
    getInstallPackage(version, originalDirectory),
    getTemplateInstallPackage(template, originalDirectory),
  ]).then(([packageToInstall, templateToInstall]) => {
    const allDependencies = ['react', 'react-dom', packageToInstall];

    console.log('Installing packages. This might take a couple of minutes.');
    // 从网址或路径中提取软件包名称，也就是获取安装包名称这里之前
    Promise.all([
      getPackageInfo(packageToInstall),
      getPackageInfo(templateToInstall),
    ])
      .then(([packageInfo, templateInfo]) =>
        checkIfOnline(useYarn).then(isOnline => ({
          isOnline,
          packageInfo,
          templateInfo,
        }))
      )
      .then(({ isOnline, packageInfo, templateInfo }) => {
        // 如果可以的话，将一个字符串转换为语义化版本
        let packageVersion = semver.coerce(packageInfo.version);

        const templatesVersionMinimum = '3.3.0';

        // Assume compatibility if we can't test the version.
        if (!semver.valid(packageVersion)) {
          packageVersion = templatesVersionMinimum;
        }

        // 模板加入依赖列表
        // Only support templates when used alongside new react-scripts versions.
        const supportsTemplates = semver.gte(
          packageVersion,
          templatesVersionMinimum
        );
        if (supportsTemplates) {
          allDependencies.push(templateToInstall);
        } else if (template) {
          console.log('');
          console.log(
            `The ${chalk.cyan(packageInfo.name)} version you're using ${
              packageInfo.name === 'react-scripts' ? 'is not' : 'may not be'
            } compatible with the ${chalk.cyan('--template')} option.`
          );
          console.log('');
        }

        console.log(
          `Installing ${chalk.cyan('react')}, ${chalk.cyan(
            'react-dom'
          )}, and ${chalk.cyan(packageInfo.name)}${
            supportsTemplates ? ` with ${chalk.cyan(templateInfo.name)}` : ''
          }...`
        );
        console.log();

        return install(
          root,
          useYarn,
          usePnp,
          allDependencies,
          verbose,
          isOnline
        ).then(() => ({
          packageInfo,
          supportsTemplates,
          templateInfo,
        }));
      })
      .then(async ({ packageInfo, supportsTemplates, templateInfo }) => {
        const packageName = packageInfo.name;
        const templateName = supportsTemplates ? templateInfo.name : undefined;
        checkNodeVersion(packageName);
        setCaretRangeForRuntimeDeps(packageName);

        const pnpPath = path.resolve(process.cwd(), '.pnp.js');

        const nodeArgs = fs.existsSync(pnpPath) ? ['--require', pnpPath] : [];

        await executeNodeScript(
          {
            cwd: process.cwd(),
            args: nodeArgs,
          },
          [root, appName, verbose, originalDirectory, templateName],
          `
        var init = require('${packageName}/scripts/init.js');
        init.apply(null, JSON.parse(process.argv[1]));
      `
        );

        if (version === 'react-scripts@0.9.x') {
          console.log(
            chalk.yellow(
              `\nNote: the project was bootstrapped with an old unsupported version of tools.\n` +
                `Please update to Node >=10 and npm >=6 to get supported tools in new projects.\n`
            )
          );
        }
      })
      .catch(reason => {
        console.log();
        console.log('Aborting installation.');
        if (reason.command) {
          console.log(`  ${chalk.cyan(reason.command)} has failed.`);
        } else {
          console.log(
            chalk.red('Unexpected error. Please report it as a bug:')
          );
          console.log(reason);
        }
        console.log();

        // On 'exit' we will delete these files from target directory.
        const knownGeneratedFiles = [
          'package.json',
          'yarn.lock',
          'node_modules',
        ];
        const currentFiles = fs.readdirSync(path.join(root));
        currentFiles.forEach(file => {
          knownGeneratedFiles.forEach(fileToMatch => {
            // This removes all knownGeneratedFiles.
            if (file === fileToMatch) {
              console.log(`Deleting generated file... ${chalk.cyan(file)}`);
              fs.removeSync(path.join(root, file));
            }
          });
        });
        const remainingFiles = fs.readdirSync(path.join(root));
        if (!remainingFiles.length) {
          // Delete target folder if empty
          console.log(
            `Deleting ${chalk.cyan(`${appName}/`)} from ${chalk.cyan(
              path.resolve(root, '..')
            )}`
          );
          process.chdir(path.resolve(root, '..'));
          fs.removeSync(path.join(root));
        }
        console.log('Done.');
        process.exit(1);
      });
  });
}

// 获取要安装的react-scripts版本
function getInstallPackage(version, originalDirectory) {
  let packageToInstall = 'react-scripts';
  const validSemver = semver.valid(version);
  if (validSemver) {
    // 拼接react-scripts版本
    packageToInstall += `@${validSemver}`;
  } else if (version) {
    if (version[0] === '@' && !version.includes('/')) {
      packageToInstall += version;
    } else if (version.match(/^file:/)) {
      packageToInstall = `file:${path.resolve(
        originalDirectory,
        version.match(/^file:(.*)?$/)[1]
      )}`;
    } else {
      // for tar.gz or alternative paths
      packageToInstall = version;
    }
  }

  const scriptsToWarn = [
    {
      name: 'react-scripts-ts',
      message: chalk.yellow(
        `The react-scripts-ts package is deprecated. TypeScript is now supported natively in Create React App. You can use the ${chalk.green(
          '--template typescript'
        )} option instead when generating your app to include TypeScript support. Would you like to continue using react-scripts-ts?`
      ),
    },
  ];
  // 询问是否使用过时的react-scripts-ts包
  for (const script of scriptsToWarn) {
    if (packageToInstall.startsWith(script.name)) {
      return prompts({
        type: 'confirm',
        name: 'useScript',
        message: script.message,
        initial: false,
      }).then(answer => {
        if (!answer.useScript) {
          process.exit(0);
        }

        return packageToInstall;
      });
    }
  }

  return Promise.resolve(packageToInstall);
}
// 获取要安装的template版本
function getTemplateInstallPackage(template, originalDirectory) {
  let templateToInstall = 'cra-template';
  if (template) {
    if (template.match(/^file:/)) {
      templateToInstall = `file:${path.resolve(
        originalDirectory,
        template.match(/^file:(.*)?$/)[1]
      )}`;
    } else if (
      template.includes('://') ||
      template.match(/^.+\.(tgz|tar\.gz)$/)
    ) {
      // for tar.gz or alternative paths
      templateToInstall = template;
    } else {
      // Add prefix 'cra-template-' to non-prefixed templates, leaving any
      // @scope/ and @version intact.
      const packageMatch = template.match(/^(@[^/]+\/)?([^@]+)?(@.+)?$/);
      const scope = packageMatch[1] || '';
      const templateName = packageMatch[2] || '';
      const version = packageMatch[3] || '';

      if (
        templateName === templateToInstall ||
        templateName.startsWith(`${templateToInstall}-`)
      ) {
        // Covers:
        // - cra-template
        // - @SCOPE/cra-template
        // - cra-template-NAME
        // - @SCOPE/cra-template-NAME
        templateToInstall = `${scope}${templateName}${version}`;
      } else if (version && !scope && !templateName) {
        // Covers using @SCOPE only
        templateToInstall = `${version}/${templateToInstall}`;
      } else {
        // Covers templates without the `cra-template` prefix:
        // - NAME
        // - @SCOPE/NAME
        templateToInstall = `${scope}${templateToInstall}-${templateName}${version}`;
      }
    }
  }

  return Promise.resolve(templateToInstall);
}

function getTemporaryDirectory() {
  return new Promise((resolve, reject) => {
    // 简单生成临时目录，如果进程退出时目录内容为空，会被删除，非空会被保留。使用UnsafeCleanup可以强制删除
    // Unsafe cleanup lets us recursively delete the directory if it contains
    // contents; by default it only allows removal if it's empty
    tmp.dir({ unsafeCleanup: true }, (err, tmpdir, callback) => {
      if (err) {
        reject(err);
      } else {
        // tmpdir生成临时目录的路径
        resolve({
          tmpdir: tmpdir,
          cleanup: () => {
            try {
              callback();
            } catch (ignored) {
              // Callback might throw and fail, since it's a temp directory the
              // OS will clean it up eventually...
            }
          },
        });
      }
    });
  });
}

// 解压文件流到文件夹下
function extractStream(stream, dest) {
  return new Promise((resolve, reject) => {
    // 当在可读流上调用 stream.pipe() 方法时会发出 'pipe' 事件，并将此可写流添加到其目标集
    stream.pipe(
      // 解压到文件夹并返回一个流，如果文件夹已经存在就先删除
      unpack(dest, err => {
        if (err) {
          reject(err);
        } else {
          resolve(dest);
        }
      })
    );
  });
}

// Extract package name from tarball url or path.
function getPackageInfo(installPackage) {
  if (installPackage.match(/^.+\.(tgz|tar\.gz)$/)) {
    // 获取生成临时目录的信息
    return getTemporaryDirectory()
      .then(obj => {
        let stream;
        if (/^http/.test(installPackage)) {
          stream = hyperquest(installPackage);
        } else {
          stream = fs.createReadStream(installPackage);
        }
        return extractStream(stream, obj.tmpdir).then(() => obj);
      })
      .then(obj => {
        const { name, version } = require(path.join(
          obj.tmpdir,
          'package.json'
        ));
        // 清空stream,防止一个stream被多个stream多次pipe，防止内存泄露
        obj.cleanup();
        // 返回下载的包的信息
        return { name, version };
      })
      .catch(err => {
        // The package name could be with or without semver version, e.g. react-scripts-0.2.0-alpha.1.tgz
        // However, this function returns package name only without semver version.
        console.log(
          `Could not extract the package name from the archive: ${err.message}`
        );
        const assumedProjectName = installPackage.match(
          /^.+\/(.+?)(?:-\d+.+)?\.(tgz|tar\.gz)$/
        )[1];
        console.log(
          `Based on the filename, assuming it is "${chalk.cyan(
            assumedProjectName
          )}"`
        );
        return Promise.resolve({ name: assumedProjectName });
      });
  } else if (installPackage.startsWith('git+')) {
    // git+就是用来指明这是一个git url，解释如下：
    // https://stackoverflow.com/questions/31457753/what-does-git-mean-in-the-url

    // Pull package name out of git urls e.g:
    // git+https://github.com/mycompany/react-scripts.git
    // git+ssh://github.com/mycompany/react-scripts.git#v1.2.3
    return Promise.resolve({
      name: installPackage.match(/([^/]+)\.git(#.*)?$/)[1],
    });
  } else if (installPackage.match(/.+@/)) {
    // Do not match @scope/ when stripping off @version or @tag
    return Promise.resolve({
      name: installPackage.charAt(0) + installPackage.substr(1).split('@')[0],
      version: installPackage.split('@')[1],
    });
  } else if (installPackage.match(/^file:/)) {
    const installPackagePath = installPackage.match(/^file:(.*)?$/)[1];
    const { name, version } = require(path.join(
      installPackagePath,
      'package.json'
    ));
    return Promise.resolve({ name, version });
  }
  return Promise.resolve({ name: installPackage });
}
// 检查当前npm版本是否符合要求
function checkNpmVersion() {
  let hasMinNpm = false;
  let npmVersion = null;
  try {
    npmVersion = execSync('npm --version').toString().trim();
    hasMinNpm = semver.gte(npmVersion, '6.0.0');
  } catch (err) {
    // ignore
  }
  return {
    hasMinNpm: hasMinNpm,
    npmVersion: npmVersion,
  };
}

// 检查yarn版本，不同版本对--use-pnp选项的支持不同
function checkYarnVersion() {
  const minYarnPnp = '1.12.0';
  const maxYarnPnp = '2.0.0';
  let hasMinYarnPnp = false;
  let hasMaxYarnPnp = false;
  let yarnVersion = null;
  try {
    yarnVersion = execSync('yarnpkg --version').toString().trim();
    if (semver.valid(yarnVersion)) {
      hasMinYarnPnp = semver.gte(yarnVersion, minYarnPnp);
      hasMaxYarnPnp = semver.lt(yarnVersion, maxYarnPnp);
    } else {
      // Handle non-semver compliant yarn version strings, which yarn currently
      // uses for nightly builds. The regex truncates anything after the first
      // dash. See #5362.
      const trimmedYarnVersionMatch = /^(.+?)[-+].+$/.exec(yarnVersion);
      if (trimmedYarnVersionMatch) {
        const trimmedYarnVersion = trimmedYarnVersionMatch.pop();
        hasMinYarnPnp = semver.gte(trimmedYarnVersion, minYarnPnp);
        hasMaxYarnPnp = semver.lt(trimmedYarnVersion, maxYarnPnp);
      }
    }
  } catch (err) {
    // ignore
  }
  return {
    hasMinYarnPnp: hasMinYarnPnp,
    hasMaxYarnPnp: hasMaxYarnPnp,
    yarnVersion: yarnVersion,
  };
}

// 检测node版本是否满足node_modules中指定的最低node版本
function checkNodeVersion(packageName) {
  const packageJsonPath = path.resolve(
    process.cwd(),
    'node_modules',
    packageName,
    'package.json'
  );

  if (!fs.existsSync(packageJsonPath)) {
    return;
  }

  const packageJson = require(packageJsonPath);
  if (!packageJson.engines || !packageJson.engines.node) {
    return;
  }

  if (!semver.satisfies(process.version, packageJson.engines.node)) {
    console.error(
      chalk.red(
        'You are running Node %s.\n' +
          'Create React App requires Node %s or higher. \n' +
          'Please update your version of Node.'
      ),
      process.version,
      packageJson.engines.node
    );
    process.exit(1);
  }
}
// 检查创建项目的名称
function checkAppName(appName) {
  const validationResult = validateProjectName(appName);
  if (!validationResult.validForNewPackages) {
    console.error(
      chalk.red(
        `Cannot create a project named ${chalk.green(
          `"${appName}"`
        )} because of npm naming restrictions:\n`
      )
    );
    [
      ...(validationResult.errors || []),
      ...(validationResult.warnings || []),
    ].forEach(error => {
      console.error(chalk.red(`  * ${error}`));
    });
    console.error(chalk.red('\nPlease choose a different project name.'));
    process.exit(1);
  }

  // TODO: there should be a single place that holds the dependencies
  const dependencies = ['react', 'react-dom', 'react-scripts'].sort();
  // 创建项目名称和dependencies重复
  if (dependencies.includes(appName)) {
    console.error(
      chalk.red(
        `Cannot create a project named ${chalk.green(
          `"${appName}"`
        )} because a dependency with the same name exists.\n` +
          `Due to the way npm works, the following names are not allowed:\n\n`
      ) +
        chalk.cyan(dependencies.map(depName => `  ${depName}`).join('\n')) +
        chalk.red('\n\nPlease choose a different project name.')
    );
    process.exit(1);
  }
}
// 补充版本号信息，就是追加一个^，用于锁定大版本信息不可被修改 
function makeCaretRange(dependencies, name) {
  const version = dependencies[name];

  if (typeof version === 'undefined') {
    console.error(chalk.red(`Missing ${name} dependency in package.json`));
    process.exit(1);
  }

  let patchedVersion = `^${version}`;

  if (!semver.validRange(patchedVersion)) {
    console.error(
      `Unable to patch ${name} dependency version because version ${chalk.red(
        version
      )} will become invalid ${chalk.red(patchedVersion)}`
    );
    patchedVersion = version;
  }

  dependencies[name] = patchedVersion;
}

// 设置运行时依赖包[react,react-dom]的大版本锁定，
// 检查传入的依赖包(react-scripts)的版本信息
function setCaretRangeForRuntimeDeps(packageName) {
  const packagePath = path.join(process.cwd(), 'package.json');
  const packageJson = require(packagePath);

  if (typeof packageJson.dependencies === 'undefined') {
    console.error(chalk.red('Missing dependencies in package.json'));
    process.exit(1);
  }

  const packageVersion = packageJson.dependencies[packageName];
  if (typeof packageVersion === 'undefined') {
    console.error(chalk.red(`Unable to find ${packageName} in package.json`));
    process.exit(1);
  }

  makeCaretRange(packageJson.dependencies, 'react');
  makeCaretRange(packageJson.dependencies, 'react-dom');
  // 写入我们需要创建的目录下的 package.json 中
  fs.writeFileSync(packagePath, JSON.stringify(packageJson, null, 2) + os.EOL);
}

// If project only contains files generated by GH, it’s safe.
// Also, if project contains remnant error logs from a previous
// installation, lets remove them now.
// We also special case IJ-based products .idea because it integrates with CRA:
// https://github.com/facebook/create-react-app/pull/368#issuecomment-243446094
function isSafeToCreateProjectIn(root, name) {
  const validFiles = [
    '.DS_Store',
    '.git',
    '.gitattributes',
    '.gitignore',
    '.gitlab-ci.yml',
    '.hg',
    '.hgcheck',
    '.hgignore',
    '.idea',
    '.npmignore',
    '.travis.yml',
    'docs',
    'LICENSE',
    'README.md',
    'mkdocs.yml',
    'Thumbs.db',
  ];
  // These files should be allowed to remain on a failed install, but then
  // silently removed during the next create.
  // 错误日志
  const errorLogFilePatterns = [
    'npm-debug.log',
    'yarn-error.log',
    'yarn-debug.log',
  ];
  const isErrorLog = file => {
    return errorLogFilePatterns.some(pattern => file.startsWith(pattern));
  };

  const conflicts = fs
    // 同步读取指定目录
    .readdirSync(root)
    // 筛选去除在合法文件列表的文件
    .filter(file => !validFiles.includes(file))
    // IntelliJ IDEA creates module files before CRA is launched
    // 筛选去除.iml后缀的文件
    .filter(file => !/\.iml$/.test(file))
    // Don't treat log files from previous installation as conflicts
    // 筛选去除之前安装的日志文件
    .filter(file => !isErrorLog(file));

  if (conflicts.length > 0) {
    console.log(
      `The directory ${chalk.green(name)} contains files that could conflict:`
    );
    console.log();
    for (const file of conflicts) {
      try {
        // 同步获取关于文件的信息
        const stats = fs.lstatSync(path.join(root, file));
        if (stats.isDirectory()) {
          console.log(`  ${chalk.blue(`${file}/`)}`);
        } else {
          console.log(`  ${file}`);
        }
      } catch (e) {
        console.log(`  ${file}`);
      }
    }
    console.log();
    console.log(
      'Either try using a new directory name, or remove the files listed above.'
    );

    return false;
  }

  // 如果没有冲突，就遍历删除所有的错误日志
  // Remove any log files from a previous installation.
  fs.readdirSync(root).forEach(file => {
    if (isErrorLog(file)) {
      fs.removeSync(path.join(root, file));
    }
  });
  return true;
}

// 获取代理信息
function getProxy() {
  if (process.env.https_proxy) {
    return process.env.https_proxy;
  } else {
    try {
      // Trying to read https-proxy from .npmrc
      let httpsProxy = execSync('npm config get https-proxy').toString().trim();
      return httpsProxy !== 'null' ? httpsProxy : undefined;
    } catch (e) {
      return;
    }
  }
}


// See https://github.com/facebook/create-react-app/pull/3355
// 判断当前工作目录能否执行npm，检测npm能否在正确的目录下执行
function checkThatNpmCanReadCwd() {
  const cwd = process.cwd();
  let childOutput = null;
  try {
    // Note: intentionally using spawn over exec since
    // the problem doesn't reproduce otherwise.
    // `npm config list` is the only reliable way I could find
    // to reproduce the wrong path. Just printing process.cwd()
    // in a Node process was not enough.
    childOutput = spawn.sync('npm', ['config', 'list']).output.join('');
  } catch (err) {
    // Something went wrong spawning node.
    // Not great, but it means we can't do this check.
    // We might fail later on, but let's continue.
    return true;
  }
  if (typeof childOutput !== 'string') {
    return true;
  }
  const lines = childOutput.split('\n');
  // `npm config list` output includes the following line:
  // "; cwd = C:\path\to\current\dir" (unquoted)
  // I couldn't find an easier way to get it.
  const prefix = '; cwd = ';
  const line = lines.find(line => line.startsWith(prefix));
  if (typeof line !== 'string') {
    // Fail gracefully. They could remove it.
    return true;
  }
  const npmCWD = line.substring(prefix.length);
  if (npmCWD === cwd) {
    return true;
  }
  console.error(
    chalk.red(
      `Could not start an npm process in the right directory.\n\n` +
        `The current directory is: ${chalk.bold(cwd)}\n` +
        `However, a newly started npm process runs in: ${chalk.bold(
          npmCWD
        )}\n\n` +
        `This is probably caused by a misconfigured system terminal shell.`
    )
  );
  if (process.platform === 'win32') {
    console.error(
      chalk.red(`On Windows, this can usually be fixed by running:\n\n`) +
        `  ${chalk.cyan(
          'reg'
        )} delete "HKCU\\Software\\Microsoft\\Command Processor" /v AutoRun /f\n` +
        `  ${chalk.cyan(
          'reg'
        )} delete "HKLM\\Software\\Microsoft\\Command Processor" /v AutoRun /f\n\n` +
        chalk.red(`Try to run the above two lines in the terminal.\n`) +
        chalk.red(
          `To learn more about this problem, read: https://blogs.msdn.microsoft.com/oldnewthing/20071121-00/?p=24433/`
        )
    );
  }
  return false;
}

// 检查是否在线
function checkIfOnline(useYarn) {
  if (!useYarn) {
    // Don't ping the Yarn registry.
    // We'll just assume the best case.
    return Promise.resolve(true);
  }

  return new Promise(resolve => {
    dns.lookup('registry.yarnpkg.com', err => {
      let proxy;
      if (err != null && (proxy = getProxy())) {
        // If a proxy is defined, we likely can't resolve external hostnames.
        // Try to resolve the proxy name as an indication of a connection.
        dns.lookup(url.parse(proxy).hostname, proxyErr => {
          resolve(proxyErr == null);
        });
      } else {
        resolve(err == null);
      }
    });
  });
}

  // 安装依赖同时copy react-scripts下面的template到当前目录
function executeNodeScript({ cwd, args }, data, source) {
  return new Promise((resolve, reject) => {
    const child = spawn(
      process.execPath,
      [...args, '-e', source, '--', JSON.stringify(data)],
      { cwd, stdio: 'inherit' }
    );

    child.on('close', code => {
      if (code !== 0) {
        reject({
          command: `node ${args.join(' ')}`,
        });
        return;
      }
      resolve();
    });
  });
}

// 查询最新版本的信息
/*
{
  "next": "4.0.0-next.117",
  "latest": "4.0.3",
  "canary": "3.3.0-next.38"
}
*/
function checkForLatestVersion() {
  return new Promise((resolve, reject) => {
    https
      .get(
        'https://registry.npmjs.org/-/package/create-react-app/dist-tags',
        res => {
          if (res.statusCode === 200) {
            let body = '';
            res.on('data', data => (body += data));
            res.on('end', () => {
              resolve(JSON.parse(body).latest);
            });
          } else {
            reject();
          }
        }
      )
      .on('error', () => {
        reject();
      });
  });
}

module.exports = {
  init,
  getTemplateInstallPackage,
};
