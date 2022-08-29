# fs.lstatSync.isFileでファイルか否かを判定する

　これを使ってコピーAPIを分岐する。

<!-- more -->

# ブツ

* [リポジトリ][]

[DEMO]:https://ytyaru.github.io/Electron.fs.lstatSync.isFile.20220829172517
[リポジトリ]:https://github.com/Electron.fs.lstatSync.isFile.20220829172517

## インストール＆実行

```sh
NAME='Electron.fs.lstatSync.isFile.20220829172517'
git clone https://github.com/ytyaru/$NAME
cd $NAME
npm install
npm start
```

### 準備

1. `npm start`でアプリ起動し終了する（`db/setting.json`ファイルが自動作成される）
1. `db/setting.json`に以下をセットしファイル保存する
    1. `repo`に任意リポジトリ名（`mytestrepo`等）
1. `dst/mytestrepo`が存在しないことを確認する（あれば`dst`ごと削除する）

### 実行

1. `npm start`で起動またはアプリで<kbd>Ctrl</kbd>+<kbd>Shift</kbd>+<kbd>R</kbd>キーを押す（リロードする）
1. `dst/mytestrepo`とその配下に以下が作成される
    * `src/lib/toastify/1.11.2/min.js`
    * `src/lib/toastify/1.11.2/min.css`
    * `memo/`ディレクトリとその配下にあるファイルすべて

# 経緯

　コピーするときファイルとディレクトリでAPIを使い分けるのが面倒だった。そこで指定したパスがファイルか否かを判定することで自動的に実行するAPIを振り分けるようにしたかった。

　ググったら[stack-overflow][]に答えがあった。

> fs.lstatSync(path_string).isDirectory()

　APIドキュメントは以下。

* [lstatSync][]
* [isFile][]

[stack-overflow]:https://stackoverflow.com/questions/15630770/node-js-check-if-path-is-file-or-directory
[lstatSync]:https://nodejs.org/docs/latest/api/fs.html#fslstatsyncpath-options
[isFile]:https://nodejs.org/docs/latest/api/fs.html#statsisfile

# コード抜粋

## main.js

```javascript
ipcMain.handle('exists', (event, path)=>{ return fs.existsSync(path) })
ipcMain.handle('isFile', (event, path)=>{ return fs.lstatSync(path).isFile() })
ipcMain.handle('isDir', (event, path)=>{ return fs.lstatSync(path).isDirectory() })
ipcMain.handle('isLink', (event, path)=>{ return fs.lstatSync(path).isSymbolicLink() })
ipcMain.handle('isBlockDev', (event, path)=>{ return fs.lstatSync(path).isBlockDevice() })
ipcMain.handle('isCharDev', (event, path)=>{ return fs.lstatSync(path).isCharacterDevice() })
ipcMain.handle('isFifo', (event, path)=>{ return fs.lstatSync(path).isFIFO() })
ipcMain.handle('isSocket', (event, path)=>{ return fs.lstatSync(path).isSocket() })
ipcMain.handle('cpfile', async(event, src, dst) => {
    fs.cp(src, dst, ()=>{})
})
ipcMain.handle('cpdir', async(event, src, dst, options) => {
    if (options) { fs.cp(src, dst, options, ()=>{}) }
    else { fs.cp(src, dst, ()=>{}) }
})
```

　判定刷る処理は色々あるらしいので一応全部作っておいた。たぶんファイルやディレクトリくらいしか使わないと思う。

## preload.js

```javascript
const {remote,contextBridge,ipcRenderer} =  require('electron');
contextBridge.exposeInMainWorld('myApi', {
    exists:async(path)=>await ipcRenderer.invoke('exists', path),
    isFile:async(path)=>await ipcRenderer.invoke('isFile', path),
    isDir:async(path)=>await ipcRenderer.invoke('isDir', path),
    isLink:async(path)=>await ipcRenderer.invoke('isLink', path),
    isBlockDev:async(path)=>await ipcRenderer.invoke('isBlockDev', path),
    isCharDev:async(path)=>await ipcRenderer.invoke('isCharDev', path),
    isFifo:async(path)=>await ipcRenderer.invoke('isFifo', path),
    isSocket:async(path)=>await ipcRenderer.invoke('isSocket', path),
    mkdir:async(path)=>await ipcRenderer.invoke('mkdir', path),
    cpdir:async(src, dst, options)=>await ipcRenderer.invoke('cpdir', src, dst, options),
    cpfile:async(src, dst)=>await ipcRenderer.invoke('cpfile', src, dst),
})
```

## renderer.js

```javascript
const maker = new SiteMaker(setting)
await maker.make()
```

## site-maker.js

```javascript
class SiteMaker {
    constructor(setting) {
        this.setting = setting
    }
    async make() {
        await this.#cp(`src/lib/toastify/1.11.2/min.js`)
        await this.#cp(`src/lib/toastify/1.11.2/min.css`)
        await this.#cp(`test`) // 存在しない
        await this.#cp(`memo/`) // 存在する
    }
    async #cp(path) {
        const exists = await window.myApi.exists(path)
        if (!exists) { console.log(`Not exists. ${path}`); return; }
        // ファイルまたはディレクトリが存在しなければエラーになるので事前にexists判定する
        const isFile = await window.myApi.isFile(path) // Uncaught (in promise) Error: Error invoking remote method 'isFile': Error: ENOENT: no such file or directory, lstat 'test'
        console.log(`isFile: ${isFile}`)
        if (isFile) { await this.#cpfile(path) }
        else { await this.#cpdir(path) } // ディレクトリとみなす
    }
    async #cpfile(path) { await window.myApi.cpfile(path, `dst/${this.setting.github.repo}/${path}`) }
    async #cpdir(path) { await window.myApi.cpdir(path, `dst/${this.setting.github.repo}/${path}`, {'recursive':true, 'preserveTimestamps':true}) }
```

　`cpfile`と`cpdir`を使い分けするのが面倒だったので、自動的に振り分けるようにした。そのためにはファイルかディレクトリかを判別できる必要があった。そこで`isFile`を使う。

　罠があった。もしファイルもディレクトリも何も存在していないパスを指定して`isFile`したら以下エラーになる。

```
Uncaught (in promise) Error: Error invoking remote method 'isFile': Error: ENOENT: no such file or directory, lstat 'test'
```

　それは困るので、`exists`で存在確認をしてから実行するようにした。

1. 存在確認する
1. ファイル／ディレクトリ判定する
1. コピーする

　なんでこんな面倒な手順を踏まないといけないんだっけ？　私、すごいマヌケなことをしている気がする。というか、ファイルも`cpdir`でいけるのでは？

```javascript
await this.#cpdir(`src/lib/toastify/1.11.2/min.css`)
```

　はいできました。ですよねー。前回自分で気づいてたはずなのに。なにをトチ狂ったのか。今回の苦労は一体何だったのか。`isFile`とかしなくてよかったじゃん……。

　まあAPIの勉強になったということで。

