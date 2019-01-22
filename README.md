# @ngx-electron/main

解决在渲染进程中创建窗口，创建Tray，窗口间传递数据。同时需要在angular中引入@ngx-electron/core模块，以angular的风格来操作。

完整例子请看 @ngx-electron/cli 并使用ngx-electron来创建 并代替electron来启动应用

## 使用(在主进程中引用)

在启动electron时可以配置一些参数如 先在4200端口启动angular项目 在由electron加载
```
electron . --server --port 4200 --host localhost
```


初始化ipcMain的一些监听，与@ngx-electron/core或@ngx-electron/data进行交互，用户无需关心，可以减少大量的ipc操作
* function initElectronMainIpcListener(): void

创建一个tray（在windows中有效，否则返回null）
imageUrl: 图片路径 相对于angular中assets文件夹的路径 统一使用png图片
* function createTray(imageUrl: string): Tray

创建一个窗体
routerUrl：路由url
options：窗体的选项 为了方便创建，原有的一些默认选项被调整 被调整的选项如下
key：对一个窗体指定一个字符串，此key为全局唯一，即所有的窗体必须保证有不同的key，默认key为打开的路由地址，当下次创建已有key的窗体时不会创建新的窗体而是那个窗体获得焦点
```json
{
    "hasShadow": true,
    "frame": false,
    "transparent": true,
    "show": false
}
```
* function createWindow(routerUrl: string, options: BrowserWindowConstructorOptions = {}, key = routerUrl): BrowserWindow


## 例子

加载路由为page1的页面

main.ts

```typescript
import {app, BrowserWindow, Tray} from 'electron';
import {createTray, createWindow, initElectronMainIpcListener} from '@ngx-electron/main';

let loginWin: BrowserWindow, tray: Tray;

// 初始化监听
initElectronMainIpcListener();


function init() {
    console.log(process.platform);
    tray = createTray('icon/icon.png');

    loginWin = createWindow('page1', {
        width: 439,
        height: 340,
        alwaysOnTop: true,
        skipTaskbar: true,
        resizable: false,
        fullscreenable: false,
        maximizable: false,
        title: 'moon'
    });
    loginWin.on('close', () => app.quit());
}

```

