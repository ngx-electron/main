import {BrowserWindow, ipcMain, Tray, nativeImage, BrowserWindowConstructorOptions, app, Menu} from 'electron';
// import * as electronReload from 'electron-reload';
import * as path from 'path';
import * as url from 'url';
import { autoUpdater } from 'electron-updater';
import * as http from 'http';
import {Error} from 'tslint/lib/error';

let isInit = false;
// winMap
const winIdMap = new Map<any, number>();
let appTray: Tray;


let isServer = false;
let host;
let port;

function getArgValue(args: string[], name: string): string | boolean {
    let argNameIndex;
    if (argNameIndex = args.indexOf(name)) {
        const argValueIndex = argNameIndex + 1;
        if (args.length > argValueIndex) {
            return args[argValueIndex];
        } else {
            throw new Error(`请在${name}后输入值`);
        }
    }
    return false;
}

/**
 * 新开一个窗口
 * @param routerUrl 打开窗口加载的路由名字
 * @param options 创建窗口参数 有如下默认值
 * hasShadow: true
 * frame: false
 * transparent: true
 * show: false
 */
export function createWindow(routerUrl: string, options: BrowserWindowConstructorOptions = {}, key = routerUrl): BrowserWindow {
    let win = new BrowserWindow({
        hasShadow: true,
        frame: false,
        transparent: true,
        show: false,
        ...options
    });
    console.log(`创建窗口routerUrl：${routerUrl}`);
    if (isServer) {
        const loadUrl = `http://${ host }:${ port }/#${ routerUrl }`;
        console.log(`创建窗口加载服务：${loadUrl}`);
        // electronReload(app.getAppPath(), {
        //     electron: require(`${app.getAppPath()}/node_modules/electron`)
        // });
        win.loadURL(loadUrl);
    } else {
        console.log(`创建本地文件窗口`);
        win.loadURL(` ${ url.format({
            pathname: path.join(app.getAppPath(), `/dist/${ app.getName() }/index.html`),
            protocol: 'file:',
            slashes: true
        }) }#${ routerUrl }`);
    }
    winIdMap.set(key, win.id);
    if (!isServer) {
        win.webContents.openDevTools();
    }
    win.on('ready-to-show', () => {
        win.show();
        win.focus();
    });
    win.on('closed', () => {
        winIdMap.delete(key);
        win = null;
    });
    return win;
}
export function getWinIdByKey(key: string) {
    return winIdMap.has(key) ? winIdMap.get(key) : null;
}

export function initElectronMainIpcListener() {
    if (!isInit) {
        const args = process.argv.splice(2);
        console.log(`初始化ngx-electron-main, 启动参数：${JSON.stringify(args)}`);

        if (isServer = args.includes('--server')) {
            console.log('加载服务的方式运行');
            port = getArgValue(args, '--port') || 4200;
            host = getArgValue(args, '--host') || 'localhost';
            console.log(`host:${host}`);
            console.log(`port:${port}`);
        }
        isInit = true;
        // 判断是否以服务的形式加载页面
        ipcMain.on('ngx-electron-is-server', event => event.returnValue = isServer);
        // 如果当前以服务的形式加载页面，得到当前服务的port
        ipcMain.on('ngx-electron-get-port', event => event.returnValue = port);
        // 如果当前以服务的形式加载页面，得到当前服务的host
        ipcMain.on('ngx-electron-get-host', event => event.returnValue = host);
        // 是否为mac
        ipcMain.on('ngx-electron-is-mac', event => event.returnValue = isMac());
        // 是否为windows
        ipcMain.on('ngx-electron-is-windows', event => event.returnValue = isWindows());
        // 是否为linux
        ipcMain.on('ngx-electron-is-linux', event => event.returnValue = isLinux());

        // 用于在渲染进程中监测主进程是否加载此文件
        ipcMain.on('ngx-electron-load-electron-main', () => {});
        // 跟据key获得win对象 同步返回 winId
        ipcMain.on('ngx-electron-get-win-id-by-key', (event, key) =>
            event.returnValue = getWinIdByKey(key));
        // win被创建事件 保存到winMap
        ipcMain.on('ngx-electron-win-created', (event, key, winId) =>
            winIdMap.set(key, winId));
        // win被销毁
        ipcMain.on('ngx-electron-win-destroyed', (event, key) =>
            winIdMap.delete(key));

        /**
         * 检测是否有新版
         */
        ipcMain.on('ngx-electron-check-for-updates', e => {
            // 执行自动更新检查
            autoUpdater.setFeedURL('http://www.liangshen.sit/chat/latest/win');
            autoUpdater.autoDownload = false;
            autoUpdater.on('error', error => e.sender.send('error', error));
            autoUpdater.on('checking-for-update', () => e.sender.send('checking-for-update'));
            autoUpdater.on('update-available', info => e.sender.send('update-available', info));
            autoUpdater.on('update-not-available', info => e.sender.send('update-not-available', info));
            autoUpdater.checkForUpdates();
        });
        /**
         * 下载新版
         */
        ipcMain.on('ngx-electron-download-update', e => {
            autoUpdater.downloadUpdate();

            // 更新下载进度事件
            autoUpdater.on('download-progress', progressObj =>
                e.sender.send('ngx-electron-download-progress', progressObj));
            // 下载完成
            autoUpdater.on('update-downloate-downloaded',
                (event, releaseNotes, releaseName, releaseDate, updateUrl, quitAndUpdate) => e.sender.send(
                    'ngx-electron-update-downloate-downloaded', event, releaseNotes, releaseName, releaseDate, updateUrl, quitAndUpdate));
        });
        /**
         * 退出当前版本安装新版
         */
        ipcMain.on('ngx-electron-quit-and-install', () => autoUpdater.quitAndInstall());
    }
}
function convertImgToDataURLCanvas(imageUrl, callback) {
    http.get(imageUrl, res => {
        const chunks = []; // 用于保存网络请求不断加载传输的缓冲数据
        let size = 0;　　 // 保存缓冲数据的总长度
        res.on('data', chunk => {
            chunks.push(chunk);　 // 在进行网络请求时，会不断接收到数据(数据不是一次性获取到的)，
            // node会把接收到的数据片段逐段的保存在缓冲区（Buffer），
            // 这些数据片段会形成一个个缓冲对象（即Buffer对象），
            // 而Buffer数据的拼接并不能像字符串那样拼接（因为一个中文字符占三个字节），
            // 如果一个数据片段携带着一个中文的两个字节，下一个数据片段携带着最后一个字节，
            // 直接字符串拼接会导致乱码，为避免乱码，所以将得到缓冲数据推入到chunks数组中，
            // 利用下面的node.js内置的Buffer.concat()方法进行拼接
            // 累加缓冲数据的长度
            size += chunk.length;
        });

        res.on('end', err => {
            // Buffer.concat将chunks数组中的缓冲数据拼接起来，返回一个新的Buffer对象赋值给data
            const data = Buffer.concat(chunks, size);
            // 可通过Buffer.isBuffer()方法判断变量是否为一个Buffer对象
            console.log(Buffer.isBuffer(data));
            // 将Buffer对象转换为字符串并以base64编码格式显示
            // const base64Img = data.toString('base64');
            // 进入终端terminal,然后进入index.js所在的目录，
            // console.log(`data:image/png;base64,${base64Img}`);
            const image = path.join(app.getAppPath(), `/dist/${app.getName()}/assets/${imageUrl}`);
            console.log('dataurl:' + nativeImage.createFromPath(image).toDataURL());
            callback(nativeImage.createFromDataURL(nativeImage.createFromPath(image).toDataURL()));
            // callback(nativeImage.createFromDataURL(data.toString('base64')));
            // 在终端中输入node index.js
            // 打印出来的就是图片的base64编码格式，格式如下

        });

    });
}

function convertImgToDataURLCanvas2(imageUrl) {
    return new Promise((resolve, reject) => {
        http.get(imageUrl, res => {
            const chunks = []; // 用于保存网络请求不断加载传输的缓冲数据
            let size = 0;　　 // 保存缓冲数据的总长度
            res.on('data', chunk => {
                chunks.push(chunk);　 // 在进行网络请求时，会不断接收到数据(数据不是一次性获取到的)，
                // node会把接收到的数据片段逐段的保存在缓冲区（Buffer），
                // 这些数据片段会形成一个个缓冲对象（即Buffer对象），
                // 而Buffer数据的拼接并不能像字符串那样拼接（因为一个中文字符占三个字节），
                // 如果一个数据片段携带着一个中文的两个字节，下一个数据片段携带着最后一个字节，
                // 直接字符串拼接会导致乱码，为避免乱码，所以将得到缓冲数据推入到chunks数组中，
                // 利用下面的node.js内置的Buffer.concat()方法进行拼接
                // 累加缓冲数据的长度
                size += chunk.length;
            });
            res.on('end', err => {
                // Buffer.concat将chunks数组中的缓冲数据拼接起来，返回一个新的Buffer对象赋值给data
                const data = Buffer.concat(chunks, size);
                // 可通过Buffer.isBuffer()方法判断变量是否为一个Buffer对象
                console.log(Buffer.isBuffer(data));
                // 将Buffer对象转换为字符串并以base64编码格式显示
                const base64Img = data.toString('base64');
                // 进入终端terminal,然后进入index.js所在的目录，
                // callback(nativeImage.createFromDataURL(data.toString('base64')));
                // 在终端中输入node index.js
                // 打印出来的就是图片的base64编码格式，格式如下
                resolve(base64Img);
            });
        });
    });
}
/**
 * 创建 tray
 * @param imageUrl
 */
export function createTray(imageUrl: string) {

    if (isMac()) {
        return null;
    }
    if (!appTray) {
        if (isServer) {
            // const img = nativeImage.createFromPath(image).toDataURL();
            // convertImgToDataURLCanvas2(`http://${ host }:${ port }/assets/${imageUrl}`).then((base64Img: string) => appTray = new Tray(nativeImage.createFromDataURL(base64Img)));
            const image = path.join(app.getAppPath(), `/dist/${app.getName()}/assets/${imageUrl}`);
            appTray = new Tray(image);
        } else {
            const image = path.join(app.getAppPath(), `/dist/${app.getName()}/assets/${imageUrl}`);
            appTray = new Tray(image);
        }
        ipcMain.on('ngx-electron-tray-created', () => {});

        ipcMain.on('ngx-electron-set-tray-image', (event, img) => appTray.setImage(img));

        ipcMain.on('ngx-electron-set-tray-context-menu', (event, template, timestamp) => {
            console.log(JSON.stringify(template));
            appTray.setContextMenu(Menu.buildFromTemplate(template.map((currentValue, index) => {
                return {
                    ...currentValue,
                    click: () => event.sender.send(`ngx-electron-click-tray-context-menu-item-${timestamp}`, index)
                };
            })));
        });

        ipcMain.on('ngx-electron-tray-on-event', (event, eventName, timestamp) =>
            appTray.on(eventName, (...args) => {
                try {
                    event.sender.send(`ngx-electron-tray-on-${eventName}-${timestamp}`, ...args);
                } catch (e) {

                }
            }));

        ipcMain.on('ngx-electron-tray-once-event', (event, eventName, timestamp) =>
            appTray.once(eventName, (...args) => event.sender.send(`ngx-electron-tray-once-${eventName}-${timestamp}`, ...args)));

        ipcMain.on('ngx-electron-tray-apply-method', (event, methodName, ...args) => appTray[methodName](...args));

        ipcMain.on('ngx-electron-set-tray-tool-tip', (event, toolTip) => appTray.setToolTip(toolTip));
    }
    return appTray;
}

export function isMac() {
    return process.platform === 'darwin';
}

export function isWindows() {
    return process.platform === 'win32';
}

export function isLinux() {
    return process.platform === 'linux';
}

export function getTray() {
    return appTray;
}

