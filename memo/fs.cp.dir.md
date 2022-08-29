# Node.jsのfs.cpでディレクトリのコピーを試みる

　できた。どうやらIPC通信では[デフォルト引数][]を渡すとその値で固定されてしまうらしい。前回はそのせいで失敗していた模様。

<!-- more -->

# ブツ

* [リポジトリ][]

[リポジトリ]:https://github.com/ytyaru/Electron.fs.cp.Directory.20220829162638

## インストール＆実行

```sh
NAME='Electron.fs.cp.Directory.20220829162638'
git clone https://github.com/ytyaru/$NAME
cd $NAME
npm install
npm start
```

## 前回

　[Node.jsのfs.cpでファイルのコピーを試みる][]のとき、ディレクトリがコピーできなかった。

[Node.jsのfs.cpでファイルのコピーを試みる]:

## 今回

　色々試した結果、どうやらIPC通信の引数にデフォルトオプションをつけていたせいらしい。それを必須にしたら成功した。何を言っているかわからないと思うので順に説明する。

# バグ調査

　main.jsの以下`cp`ハンドルに`console.log`を仕込んだ。すると`if`側に入ってほしいのに、実際は`else`側に入っていたことが判明した。

```javascript
ipcMain.handle('cp', async(event, src, dst, options=null) => {
    if (options) { console.log('aaaaaaaaa', src, dst, options); fs.cp(src, dst, options, ()=>{}); }
    else { console.log('bbbbbbbbb', src, dst); fs.cp(src, dst, ()=>{}); }
})
```

　`if`の条件式を`null!=options`に変えても同様だった。

　つまり、`options`は必ず`null`になっていたことになる。

　だが、呼出元ではちゃんと`options`を渡している。`{'recursive':true, 'preserveTimestamps':true}`というオプションをしっかり渡している。

```javascript
class SiteMaker {
    constructor(setting) {
        this.setting = setting
    }
    async make() {
        await this.#make(`memo/`)
    }
    async #make(path) { await window.myApi.cp(path, `dst/${this.setting.github.repo}/${path}`, {'recursive':true, 'preserveTimestamps':true}) }
```

　なのになぜ`null`になるのか？　コードをみるかぎりmain.jsの以下しかない。メソッド定義の仮引数のところで`options=null`にしている。これがそのまま入ってしまったのでは？

```javascript
ipcMain.handle('cp', async(event, src, dst, options=null) => {
```

　そんなバカな。JavaScriptは[デフォルト引数][]にできるはず。MDNにも書いてある。

[デフォルト引数]:https://developer.mozilla.org/ja/docs/Web/JavaScript/Reference/Functions/Default_parameters

　ああ、もしかしてこれもElectronのIPC通信における制約なのか？　うわー、それっぽい予感。確認するためにコードを書いてみる。

# ディレクトリをコピーするコード

　以下が成功したコード。思ったとおり[デフォルト引数][]をやめたらディレクトリのコピーができた。うわー……

## main.js

```javascript
ipcMain.handle('cpdir', async(event, src, dst, options) => {
    if (null!=options) { console.log('aaaaaaaaa', src, dst, options); fs.cp(src, dst, options, ()=>{}); }
    else { console.log('bbbbbbbbb', src, dst); fs.cp(src, dst, ()=>{}); }
})
```

　ようするに[fs.cp][]の引数`options`を必須にした。ただし`cpdir`という名前で新しくICPハンドルを作った。ファイルをコピーしたいなら先述の`cp`ハンドルを使う。

## preload.js

```javascript
contextBridge.exposeInMainWorld('myApi', {
    cpdir:async(src, dst, options)=>await ipcRenderer.invoke('cpdir', src, dst, options),
})
```

## renderer.js

```javascript
class SiteMaker {
    constructor(setting) {
        this.setting = setting
    }
    async make() {
        await this.#cpdir(`memo/`)
    }
    async #cpdir(path) { await window.myApi.cpdir(path, `dst/${this.setting.github.repo}/${path}`, {'recursive':true, 'preserveTimestamps':true}) }
}
```

# 結論

　IPC通信の制約によりIPCハンドラの引数には[デフォルト引数][]が使えない。仮に使ったとしたら、必ずそのデフォルト値がセットされてしまう。

　これはひどい。ちゃんと教えてほしかった。

