/*
 * Wire
 * Copyright (C) 2016 Wire Swiss GmbH
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program. If not, see http://www.gnu.org/licenses/.
 *
 */

// https://github.com/atom/atom/blob/master/src/main-process/squirrel-update.coffee
'use strict';

const {app} = require('electron');

const config = require('./config');
const spawnProcess = require('spawn-process');
const fs = require('fs');
const path = require('path');

app.setAppUserModelId('com.squirrel.wire.' + config.NAME.toLowerCase());

let appFolder = path.resolve(process.execPath, '..');
let rootFolder = path.resolve(appFolder, '..');
let updateDotExe = path.join(rootFolder, 'Update.exe');

let exeName = config.NAME + '.exe';
let linkName = config.NAME + '.lnk';

let taskbarLink = path.resolve(path.join(process.env.APPDATA, 'Microsoft', 'Internet Explorer', 'Quick Launch', 'User Pinned', 'TaskBar', linkName));


function spawnUpdate(args, callback) {
  spawnProcess(updateDotExe, args, callback);
};


function createStartShortcut(callback) {
  spawnUpdate(['--createShortcut', exeName, '-l=StartMenu'], callback);
};


function createDesktopShortcut(callback) {
  spawnUpdate(['--createShortcut', exeName, '-l=Desktop'], callback);
};


function removeShortcuts(callback) {
  spawnUpdate(['--removeShortcut', exeName, '-l=Desktop,Startup,StartMenu'], function() {
    fs.unlink(taskbarLink, callback);
  });
};


function installUpdate() {
  spawnUpdate(['--update', config.UPDATE_WIN_URL]);
};


function scheduleUpdate() {
  setTimeout(installUpdate, config.UPDATE_DELAY);
  setInterval(installUpdate, config.UPDATE_INTERVAL);
};


function handleSquirrelEvent(shouldQuit) {
  let squirrelEvent = process.argv[1];
  switch (squirrelEvent) {
    case '--squirrel-install':
      createStartShortcut(function() {
        createDesktopShortcut(function() {
          app.quit();
        });
      });
      return true;
    case '--squirrel-updated':
      app.exit();
      return true;
    case '--squirrel-uninstall':
      removeShortcuts(function() {
        app.quit();
      });
      return true;
    case '--squirrel-obsolete':
      app.quit();
      return true;
  }
  if (shouldQuit) {
    app.quit();
  }
  scheduleUpdate();
  return false;
};


module.exports = {
  installUpdate: installUpdate,
  handleSquirrelEvent: handleSquirrelEvent,
};
