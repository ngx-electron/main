#!/usr/bin/env node
import * as program from 'commander';

process.title = 'ngx-electron';

program.version(require('../package').version)
    .usage('<command> [options]')
    .command('start', '启动应用程序')
    .alias('.')
    .option('-H, --host [value]', '设置加载页面的服务器的host', 'localhost')
    .option('-p, --port [value]', '设置加载页面的服务器的端口', '4200')
    .option('-s, --server', '设置加载的页面来自于服务器')
    .action((type, name) => {
        console.log(type);
        console.log(name);
    })
    .parse(process.argv);
