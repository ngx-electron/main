import {initTray} from './ngx-electron-tray';
import {initUpdateListener} from './ngx-electron-main-update';
import {initUtilListener} from './ngx-electron-main-util';
import {initWindowListener} from './ngx-electron-main-window';
import {initArgs} from './ngx-electron-main-args';

let isInit = false;

function initElectronMainIpcListener(trayImage?: string, isWeb = false) {
    if (!isInit) {
        isInit = true;
        initArgs();
        initTray(trayImage, isWeb);
        initUtilListener();
        initWindowListener();
        initUpdateListener();
    }
}

export {initElectronMainIpcListener};

