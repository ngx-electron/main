"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var electron_1 = require("electron");
// import * as electronReload from 'electron-reload';
var path = require("path");
var url = require("url");
var electron_updater_1 = require("electron-updater");
var http = require("http");
var error_1 = require("tslint/lib/error");
var isInit = false;
// winMap
var winIdMap = new Map();
var appTray;
var isServer = false;
var host;
var port;
function getArgValue(args, name) {
    var argNameIndex;
    if (argNameIndex = args.indexOf(name)) {
        var argValueIndex = argNameIndex + 1;
        if (args.length > argValueIndex) {
            return args[argValueIndex];
        }
        else {
            throw new error_1.Error("\u8BF7\u5728" + name + "\u540E\u8F93\u5165\u503C");
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
function createWindow(routerUrl, options, key) {
    if (options === void 0) { options = {}; }
    if (key === void 0) { key = routerUrl; }
    var win = new electron_1.BrowserWindow(tslib_1.__assign({ hasShadow: true, frame: false, transparent: true, show: false }, options));
    console.log("\u521B\u5EFA\u7A97\u53E3routerUrl\uFF1A" + routerUrl);
    if (isServer) {
        var loadUrl = "http://" + host + ":" + port + "/#" + routerUrl;
        console.log("\u521B\u5EFA\u7A97\u53E3\u52A0\u8F7D\u670D\u52A1\uFF1A" + loadUrl);
        // electronReload(app.getAppPath(), {
        //     electron: require(`${app.getAppPath()}/node_modules/electron`)
        // });
        win.loadURL(loadUrl);
    }
    else {
        console.log("\u521B\u5EFA\u672C\u5730\u6587\u4EF6\u7A97\u53E3");
        win.loadURL(" " + url.format({
            pathname: path.join(electron_1.app.getAppPath(), "/dist/" + electron_1.app.getName() + "/index.html"),
            protocol: 'file:',
            slashes: true
        }) + "#" + routerUrl);
    }
    winIdMap.set(key, win.id);
    if (!isServer) {
        win.webContents.openDevTools();
    }
    win.on('ready-to-show', function () {
        win.show();
        win.focus();
    });
    win.on('closed', function () {
        winIdMap.delete(key);
        win = null;
    });
    return win;
}
exports.createWindow = createWindow;
function getWinIdByKey(key) {
    return winIdMap.has(key) ? winIdMap.get(key) : null;
}
exports.getWinIdByKey = getWinIdByKey;
function initElectronMainIpcListener() {
    if (!isInit) {
        var args = process.argv.splice(2);
        console.log("\u521D\u59CB\u5316ngx-electron-main, \u542F\u52A8\u53C2\u6570\uFF1A" + JSON.stringify(args));
        if (isServer = args.includes('--server')) {
            console.log('加载服务的方式运行');
            port = getArgValue(args, '--port') || 4200;
            host = getArgValue(args, '--host') || 'localhost';
            console.log("host:" + host);
            console.log("port:" + port);
        }
        isInit = true;
        // 判断是否以服务的形式加载页面
        electron_1.ipcMain.on('ngx-electron-is-server', function (event) { return event.returnValue = isServer; });
        // 如果当前以服务的形式加载页面，得到当前服务的port
        electron_1.ipcMain.on('ngx-electron-get-port', function (event) { return event.returnValue = port; });
        // 如果当前以服务的形式加载页面，得到当前服务的host
        electron_1.ipcMain.on('ngx-electron-get-host', function (event) { return event.returnValue = host; });
        // 是否为mac
        electron_1.ipcMain.on('ngx-electron-is-mac', function (event) { return event.returnValue = isMac(); });
        // 是否为windows
        electron_1.ipcMain.on('ngx-electron-is-windows', function (event) { return event.returnValue = isWindows(); });
        // 是否为linux
        electron_1.ipcMain.on('ngx-electron-is-linux', function (event) { return event.returnValue = isLinux(); });
        // 用于在渲染进程中监测主进程是否加载此文件
        electron_1.ipcMain.on('ngx-electron-load-electron-main', function () { });
        // 跟据key获得win对象 同步返回 winId
        electron_1.ipcMain.on('ngx-electron-get-win-id-by-key', function (event, key) {
            return event.returnValue = getWinIdByKey(key);
        });
        // win被创建事件 保存到winMap
        electron_1.ipcMain.on('ngx-electron-win-created', function (event, key, winId) {
            return winIdMap.set(key, winId);
        });
        // win被销毁
        electron_1.ipcMain.on('ngx-electron-win-destroyed', function (event, key) {
            return winIdMap.delete(key);
        });
        /**
         * 检测是否有新版
         */
        electron_1.ipcMain.on('ngx-electron-check-for-updates', function (e) {
            // 执行自动更新检查
            electron_updater_1.autoUpdater.setFeedURL('http://www.liangshen.sit/chat/latest/win');
            electron_updater_1.autoUpdater.autoDownload = false;
            electron_updater_1.autoUpdater.on('error', function (error) { return e.sender.send('error', error); });
            electron_updater_1.autoUpdater.on('checking-for-update', function () { return e.sender.send('checking-for-update'); });
            electron_updater_1.autoUpdater.on('update-available', function (info) { return e.sender.send('update-available', info); });
            electron_updater_1.autoUpdater.on('update-not-available', function (info) { return e.sender.send('update-not-available', info); });
            electron_updater_1.autoUpdater.checkForUpdates();
        });
        /**
         * 下载新版
         */
        electron_1.ipcMain.on('ngx-electron-download-update', function (e) {
            electron_updater_1.autoUpdater.downloadUpdate();
            // 更新下载进度事件
            electron_updater_1.autoUpdater.on('download-progress', function (progressObj) {
                return e.sender.send('ngx-electron-download-progress', progressObj);
            });
            // 下载完成
            electron_updater_1.autoUpdater.on('update-downloate-downloaded', function (event, releaseNotes, releaseName, releaseDate, updateUrl, quitAndUpdate) { return e.sender.send('ngx-electron-update-downloate-downloaded', event, releaseNotes, releaseName, releaseDate, updateUrl, quitAndUpdate); });
        });
        /**
         * 退出当前版本安装新版
         */
        electron_1.ipcMain.on('ngx-electron-quit-and-install', function () { return electron_updater_1.autoUpdater.quitAndInstall(); });
    }
}
exports.initElectronMainIpcListener = initElectronMainIpcListener;
function convertImgToDataURLCanvas(imageUrl, callback) {
    http.get(imageUrl, function (res) {
        var chunks = []; // 用于保存网络请求不断加载传输的缓冲数据
        var size = 0; // 保存缓冲数据的总长度
        res.on('data', function (chunk) {
            chunks.push(chunk); // 在进行网络请求时，会不断接收到数据(数据不是一次性获取到的)，
            // node会把接收到的数据片段逐段的保存在缓冲区（Buffer），
            // 这些数据片段会形成一个个缓冲对象（即Buffer对象），
            // 而Buffer数据的拼接并不能像字符串那样拼接（因为一个中文字符占三个字节），
            // 如果一个数据片段携带着一个中文的两个字节，下一个数据片段携带着最后一个字节，
            // 直接字符串拼接会导致乱码，为避免乱码，所以将得到缓冲数据推入到chunks数组中，
            // 利用下面的node.js内置的Buffer.concat()方法进行拼接
            // 累加缓冲数据的长度
            size += chunk.length;
        });
        res.on('end', function (err) {
            // Buffer.concat将chunks数组中的缓冲数据拼接起来，返回一个新的Buffer对象赋值给data
            var data = Buffer.concat(chunks, size);
            // 可通过Buffer.isBuffer()方法判断变量是否为一个Buffer对象
            console.log(Buffer.isBuffer(data));
            // 将Buffer对象转换为字符串并以base64编码格式显示
            // const base64Img = data.toString('base64');
            // 进入终端terminal,然后进入index.js所在的目录，
            // console.log(`data:image/png;base64,${base64Img}`);
            var image = path.join(electron_1.app.getAppPath(), "/dist/" + electron_1.app.getName() + "/assets/" + imageUrl);
            console.log('dataurl:' + electron_1.nativeImage.createFromPath(image).toDataURL());
            callback(electron_1.nativeImage.createFromDataURL(electron_1.nativeImage.createFromPath(image).toDataURL()));
            // callback(nativeImage.createFromDataURL(data.toString('base64')));
            // 在终端中输入node index.js
            // 打印出来的就是图片的base64编码格式，格式如下
        });
    });
}
function convertImgToDataURLCanvas2(imageUrl) {
    return new Promise(function (resolve, reject) {
        http.get(imageUrl, function (res) {
            var chunks = []; // 用于保存网络请求不断加载传输的缓冲数据
            var size = 0; // 保存缓冲数据的总长度
            res.on('data', function (chunk) {
                chunks.push(chunk); // 在进行网络请求时，会不断接收到数据(数据不是一次性获取到的)，
                // node会把接收到的数据片段逐段的保存在缓冲区（Buffer），
                // 这些数据片段会形成一个个缓冲对象（即Buffer对象），
                // 而Buffer数据的拼接并不能像字符串那样拼接（因为一个中文字符占三个字节），
                // 如果一个数据片段携带着一个中文的两个字节，下一个数据片段携带着最后一个字节，
                // 直接字符串拼接会导致乱码，为避免乱码，所以将得到缓冲数据推入到chunks数组中，
                // 利用下面的node.js内置的Buffer.concat()方法进行拼接
                // 累加缓冲数据的长度
                size += chunk.length;
            });
            res.on('end', function (err) {
                // Buffer.concat将chunks数组中的缓冲数据拼接起来，返回一个新的Buffer对象赋值给data
                var data = Buffer.concat(chunks, size);
                // 可通过Buffer.isBuffer()方法判断变量是否为一个Buffer对象
                console.log(Buffer.isBuffer(data));
                // 将Buffer对象转换为字符串并以base64编码格式显示
                var base64Img = data.toString('base64');
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
function createTray(imageUrl) {
    if (isMac()) {
        return null;
    }
    if (!appTray) {
        if (isServer) {
            // const img = nativeImage.createFromPath(image).toDataURL();
            // convertImgToDataURLCanvas2(`http://${ host }:${ port }/assets/${imageUrl}`).then((base64Img: string) => appTray = new Tray(nativeImage.createFromDataURL(base64Img)));
            var image = path.join(electron_1.app.getAppPath(), "/dist/" + electron_1.app.getName() + "/assets/" + imageUrl);
            appTray = new electron_1.Tray(image);
        }
        else {
            var image = path.join(electron_1.app.getAppPath(), "/dist/" + electron_1.app.getName() + "/assets/" + imageUrl);
            appTray = new electron_1.Tray(image);
        }
        electron_1.ipcMain.on('ngx-electron-tray-created', function () { });
        electron_1.ipcMain.on('ngx-electron-set-tray-image', function (event, img) { return appTray.setImage(img); });
        electron_1.ipcMain.on('ngx-electron-set-tray-context-menu', function (event, template, timestamp) {
            console.log(JSON.stringify(template));
            appTray.setContextMenu(electron_1.Menu.buildFromTemplate(template.map(function (currentValue, index) {
                return tslib_1.__assign({}, currentValue, { click: function () { return event.sender.send("ngx-electron-click-tray-context-menu-item-" + timestamp, index); } });
            })));
        });
        electron_1.ipcMain.on('ngx-electron-tray-on-event', function (event, eventName, timestamp) {
            return appTray.on(eventName, function () {
                var args = [];
                for (var _i = 0; _i < arguments.length; _i++) {
                    args[_i] = arguments[_i];
                }
                var _a;
                try {
                    (_a = event.sender).send.apply(_a, ["ngx-electron-tray-on-" + eventName + "-" + timestamp].concat(args));
                }
                catch (e) {
                }
            });
        });
        electron_1.ipcMain.on('ngx-electron-tray-once-event', function (event, eventName, timestamp) {
            return appTray.once(eventName, function () {
                var args = [];
                for (var _i = 0; _i < arguments.length; _i++) {
                    args[_i] = arguments[_i];
                }
                var _a;
                return (_a = event.sender).send.apply(_a, ["ngx-electron-tray-once-" + eventName + "-" + timestamp].concat(args));
            });
        });
        electron_1.ipcMain.on('ngx-electron-tray-apply-method', function (event, methodName) {
            var args = [];
            for (var _i = 2; _i < arguments.length; _i++) {
                args[_i - 2] = arguments[_i];
            }
            return appTray[methodName].apply(appTray, args);
        });
        electron_1.ipcMain.on('ngx-electron-set-tray-tool-tip', function (event, toolTip) { return appTray.setToolTip(toolTip); });
    }
    return appTray;
}
exports.createTray = createTray;
function isMac() {
    return process.platform === 'darwin';
}
exports.isMac = isMac;
function isWindows() {
    return process.platform === 'win32';
}
exports.isWindows = isWindows;
function isLinux() {
    return process.platform === 'linux';
}
exports.isLinux = isLinux;
function getTray() {
    return appTray;
}
exports.getTray = getTray;
//# sourceMappingURL=ngx-electron-main.js.map