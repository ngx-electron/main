import { BrowserWindow, Tray, BrowserWindowConstructorOptions } from 'electron';
/**
 * 新开一个窗口
 * @param routerUrl 打开窗口加载的路由名字
 * @param options 创建窗口参数 有如下默认值
 * hasShadow: true
 * frame: false
 * transparent: true
 * show: false
 */
export declare function createWindow(routerUrl: string, options?: BrowserWindowConstructorOptions, key?: string): BrowserWindow;
export declare function getWinIdByKey(key: string): number;
export declare function initElectronMainIpcListener(): void;
/**
 * 创建 tray
 * @param imageUrl
 */
export declare function createTray(imageUrl: string): Tray;
export declare function isMac(): boolean;
export declare function isWindows(): boolean;
export declare function isLinux(): boolean;
export declare function getTray(): Tray;
