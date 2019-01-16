#!/usr/bin/env node
import * as program from 'commander';
import * as child_process from 'child_process';

process.title = 'ngx-electron';

program.version(require('../package').version)
    .usage('<command> [options]')
    .command('*', '启动应用程序')
    .option('-H, --host [value]', '设置加载页面的服务器的host', 'localhost')
    .option('-p, --port [value]', '设置加载页面的服务器的端口', '4200')
    .option('-s, --server', '设置加载的页面来自于服务器')
    .action((type, command) => {
        const {port, host, server} = command;
        const cmd = server ? (`npm-run-all -p ng serve --port ${port} --host ${host} ` +
            `wait-on http-get://${host}:${port}/ && npm run build:electron && electron ${type} --server --port ${port} --host ${host}`) :
            `tsc -p node_modules/@ngx-electron/main/tsconfig.electron.json && ng build && electron ${type}`;
        child_process.exec(cmd, (err, stdout, stderr) => {
            if (err) {
                console.log(err);
            } else if (stdout) {
                console.log(stdout);
            } else {
                console.log(stderr);
            }
        });
    })
    .parse(process.argv);
