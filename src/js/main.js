const { app, BrowserWindow, ipcMain, dialog, net } = require('electron')
const path = require('path')
const fs = require('fs') // cp, copyFileSync
const initSqlJs = require('sql.js');
const util = require('util')
const childProcess = require('child_process');
//const https = require('https');
//const axios = require('axios');
const fetch = require('electron-fetch').default;
const lib = new Map()

function createWindow () {
    const mainWindow = new BrowserWindow({
        width: 800,
        height: 600,
        //transparent: true, // 透過
        //opacity: 0.3,
        //frame: false,      // フレームを非表示にする
        webPreferences: {
            nodeIntegration: false,
            //nodeIntegration: true, // https://www.electronjs.org/ja/docs/latest/breaking-changes
            enableRemoteModule: true,
            contextIsolation: true,
            preload: path.join(__dirname, 'preload.js')
        }
    })
    mainWindow.loadFile('index.html')
    //mainWindow.setMenuBarVisibility(false);
    mainWindow.webContents.openDevTools()
}

app.whenReady().then(() => {
    createWindow()
    app.on('activate', function () {
        if (BrowserWindow.getAllWindows().length === 0) createWindow()
    })
})

app.on('window-all-closed', function () {
    if (process.platform !== 'darwin') app.quit()
})

async function loadDb(filePath=`src/db/mylog.db`) {
    if (null === filePath) { filePath = `src/db/mylog.db` }
    if (!lib.has(`DB`)) {
        const SQL = await initSqlJs().catch(e=>console.error(e))
        lib.set(`SQL`, SQL)
        const db = new SQL.Database(new Uint8Array(fs.readFileSync(filePath)))
        lib.set(`DB`, db)
    }
    return lib.get(`DB`)
}
function readFile(path, kwargs) { return fs.readFileSync(path, kwargs) }

// ここではdb.execを参照できるが、return後では参照できない謎
ipcMain.handle('loadDb', async(event, filePath=null) => {
    console.log('----- loadDb ----- ', filePath)
    return loadDb(filePath)
})
// db.execの実行結果を返すならOK
ipcMain.handle('get', async(event) => {
    console.log('----- get ----- ')
    if (!lib.has(`SQL`)) {
        loadDb()
    }
    const res = lib.get(`DB`).exec(`select * from comments order by created desc;`)
    console.log(res)
    return res[0].values
})
ipcMain.handle('insert', async(event, r)=>{
    if (!lib.has(`SQL`)) {loadDb()}
    console.debug(r)
    lib.get(`DB`).exec(`insert into comments(content, created) values('${r.content}', ${r.created});`)
    const res = lib.get(`DB`).exec(`select * from comments where created = ${r.created};`)
    return res[0].values[0]
})
ipcMain.handle('clear', async(event)=>{
    lib.get(`DB`).exec(`delete from comments;`)
})
ipcMain.handle('delete', async(event, ids)=>{
    lib.get(`DB`).exec(`begin;`)
    for (const id of ids) {
        lib.get(`DB`).exec(`delete from comments where id = ${id};`)
    }
    lib.get(`DB`).exec(`commit;`)
})
ipcMain.handle('exportDb', async(event)=>{
    return lib.get(`DB`).export()
})

ipcMain.handle('exists', (event, path)=>{ return fs.existsSync(path) })
ipcMain.handle('isFile', (event, path)=>{ return fs.lstatSync(path).isFile() })
ipcMain.handle('isDir', (event, path)=>{ return fs.lstatSync(path).isDirectory() })
ipcMain.handle('isLink', (event, path)=>{ return fs.lstatSync(path).isSymbolicLink() })
ipcMain.handle('isBlockDev', (event, path)=>{ return fs.lstatSync(path).isBlockDevice() })
ipcMain.handle('isCharDev', (event, path)=>{ return fs.lstatSync(path).isCharacterDevice() })
ipcMain.handle('isFifo', (event, path)=>{ return fs.lstatSync(path).isFIFO() })
ipcMain.handle('isSocket', (event, path)=>{ return fs.lstatSync(path).isSocket() })
ipcMain.handle('mkdir', (event, path)=>{
    if (!fs.existsSync(path)) {
        fs.mkdirSync(path, {recursive:true})
    }
})
ipcMain.handle('cpfile', async(event, src, dst) => { // Node.js v16.7.0〜 https://nodejs.org/api/fs.html#fscpsrc-dest-options-callback
    //fs.cp(src, dst, (e)=>{console.error(e)}) // e = null
    fs.cp(src, dst, ()=>{})
})
/*
ipcMain.handle('cp', async(event, src, dst, options=null) => { // Node.js v16.7.0〜 https://nodejs.org/api/fs.html#fscpsrc-dest-options-callback
    //fs.cp(src, dst) // Uncaught (in promise) Error: Error invoking remote method 'cp': TypeError [ERR_INVALID_CALLBACK]: Callback must be a function. Received undefined
    //fs.cp(src, dst, (e)=>{console.error(e)}) // e = null
    //if (null!=options) { console.log('aaaaaaaaa', src, dst, options); fs.cp(src, dst, options, ()=>{}); }
    //else { console.log('bbbbbbbbb', src, dst); fs.cp(src, dst, ()=>{}); }
    //if (options) { fs.cp(src, dst, options, ()=>{}) }
    //else { fs.cp(src, dst, ()=>{}) }
})
*/
ipcMain.handle('cpdir', async(event, src, dst, options) => { // Node.js v16.7.0〜 https://nodejs.org/api/fs.html#fscpsrc-dest-options-callback
    //fs.cp(src, dst) // Uncaught (in promise) Error: Error invoking remote method 'cp': TypeError [ERR_INVALID_CALLBACK]: Callback must be a function. Received undefined
    //fs.cp(src, dst, (e)=>{console.error(e)}) // e = null
    if (null!=options) { console.log('aaaaaaaaa', src, dst, options); fs.cp(src, dst, options, ()=>{}); }
    else { console.log('bbbbbbbbb', src, dst); fs.cp(src, dst, ()=>{}); }
    //if (options) { fs.cp(src, dst, options, ()=>{}) }
    //else { fs.cp(src, dst, ()=>{}) }
})
ipcMain.handle('readFile', (event, path, kwargs)=>{ return readFile(path, kwargs) })
ipcMain.handle('readTextFile', (event, path, encoding='utf8')=>{ return readFile(path, { encoding: encoding }) })
ipcMain.handle('writeFile', (event, path, data)=>{ return fs.writeFileSync(path, data) })
ipcMain.handle('shell', async(event, command) => {
    const exec = util.promisify(childProcess.exec);
    return await exec(command);
    //let result = await exec(command);
    //document.getElementById('result').value = result.stdout;
})

/*
ipcMain.handle('testRequest', async(event, params)=>{
    const request = net.request('https://github.com')
    request.on('response', (response) => {
        console.log(`STATUS: ${response.statusCode}`)
        console.log(`HEADERS: ${JSON.stringify(response.headers)}`)
        response.on('data', (chunk) => {
            console.log(`BODY: ${chunk}`)
        })
        response.on('end', () => {
            console.log('No more data in response.')
        })
    })
    request.end()
})
ipcMain.handle('githubUser', async(event, token)=>{
    console.log(token)
    let request = net.request({
        method: 'GET',
        url: 'https://api.github.com/user',
        headers: {
            //'Content-Type': 'application/json',
            //'Accept': 'application/vnd.github+json', // 公式に書いてあるこれをつけたらエラーになった https://docs.github.com/ja/rest/users/users#get-the-authenticated-user
            'Authorization': `token ${token}`,
        },
    });
    console.log(request)
    // レスポンス受信時の処理
    request.on('response', (response) => {
        console.debug(`STATUS: ${response.statusCode}`)
        console.debug(`HEADERS: ${JSON.stringify(response.headers)}`)
        response.on('data', (chunk) => {
            console.debug(`BODY: ${chunk}`)
//            params.onData(JSON.parse(chunk), response)
        })
        response.on('end', () => {
            console.debug('No more data in response.')
//            params.onEnd(response)
        })
    })
    // リクエストの送信
    request.end()
})
ipcMain.handle('request', async(event, params, onData=null, onEnd=null)=>{
//ipcMain.handle('request', async(event, params)=>{
    console.log('----- request -----')
    console.log(params)
    const request = net.request(params.params)
    //if (params.hasOwnProperty('body')) { request.write(params.body) }
    //console.log(params)
    //console.log(params.hasOwnProperty('params'))
    //console.log(params.hasOwnProperty('body'))
    //console.log(params.hasOwnProperty('method'))
    //console.log(params.hasOwnProperty('url'))
    //return 
    if (params.hasOwnProperty('body')) { console.log(JSON.stringify(params.body)); request.write(JSON.stringify(params.body)); }
    console.log(request)
    // レスポンス受信時の処理
    request.on('response', (response) => {
        console.debug(`STATUS: ${response.statusCode}`)
        console.debug(`HEADERS: ${JSON.stringify(response.headers)}`)
        response.on('data', (chunk) => {
            console.debug(`BODY: ${chunk}`)
            if (onData) {
                onData(JSON.parse(chunk), response)
            }
//            params.onData(JSON.parse(chunk), response)
        })
        response.on('end', () => {
            console.debug('No more data in response.')
//            params.onEnd(response)
            if (onEnd) {
                onEnd(response)
            }
        })
    })
    // リクエストの送信
    request.end()
})
ipcMain.handle('httpsRequest', async(event, url, options, onData=null, onError=null)=>{
    const request = https.request(url, options, (res)=>{
        console.log('statusCode:', res.statusCode);
        console.log('headers:', res.headers);
        res.setEncoding('utf8');
        res.on('data', (d) => {
            console.log(d)
            //process.stdout.write(d);
            if (onData) { onData(JSON.parse(d), res) }
        });
    }).on('error', (e) => {
        console.error(e);
        if (onError) { onError(e) }
    });
    if (options.hasOwnProperty('body')) {
        request.write(JSON.stringify(params.body));
    }
    request.end();
})
//ipcMain.handle('createRepo', async(event, token, name, description, onData=null, onError=null)=>{
ipcMain.handle('createRepo', async(event, username, token, repo, description)=>{
    console.log(`----- createRepo -----`)
    console.log(username)
    console.log(token)
    console.log(repo)
    console.log(description)
    //console.log(onData)
    //console.log(onError)
    const url = 'https://api.github.com/user/repos'
    const options = {
        'method': 'POST',
        'headers': {
            'Authorization': `token ${token}`,
            'Content-Type': 'application/json',
            'User-Agent': username,
        },
        'body': {
            'name': repo,
            'description': description,
        },
    }
    const request = https.request(url, options, (res)=>{
        console.log('statusCode:', res.statusCode);
        console.log('headers:', res.headers);
        res.setEncoding('utf8');
        res.on('data', (d) => {
            console.log(d)
            //process.stdout.write(d);
            //if (onData) { onData(JSON.parse(d), res) }
            //return JSON.parse(d)
        });
    }).on('error', (e) => {
        console.error(e);
        //if (onError) { onError(e) }
        //return e
    });
    if (options.hasOwnProperty('body')) {
        request.write(JSON.stringify(options.body));
    }
    request.end();
});
ipcMain.handle('createRepo2', async(event, username, token, repo, description, onData=null, onError=null)=>{
    const url = 'https://api.github.com/user/repos'
    const options = {
        'method': 'POST',
        'headers': {
            'Authorization': `token ${token}`,
            'Content-Type': 'application/json',
            'User-Agent': username,
        },
        'body': {
            'name': repo,
            'description': description,
        },
    }
    const request = https.request(url, options, (res)=>{
        console.log('statusCode:', res.statusCode);
        console.log('headers:', res.headers);
        res.setEncoding('utf8');
        res.on('data', (d) => {
            console.log(d)
            //process.stdout.write(d);
            if (onData) { onData(JSON.parse(d), res) }
            //return JSON.parse(d)
        });
    }).on('error', (e) => {
        console.error(e);
        if (onError) { onError(e) }
        //return e
    });
    if (options.hasOwnProperty('body')) {
        request.write(JSON.stringify(options.body));
    }
    request.end();
})
ipcMain.handle('axiosPost', async(event, url, data, config)=>{
    const res = await axios.post(url, data, config).catch(e=>console.error(e));
    return res
})
ipcMain.handle('axiosGet', async(event, url, config)=>{
    const res = await axios.get(url, config).catch(e=>console.error(e));
    return res
})
ipcMain.handle('axiosGet2', async(event, url)=>{
    const config = {
        'headers': {
            'Authorization': `token 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`,
            'Content-Type': 'application/json',
        }
    }
    const res = await axios.get(url, config)
    return res
})
ipcMain.handle('axiosGetUser', async(event)=>{
    const url = `https://api.github.com/user`
    const config = {
        'headers': {
            'Authorization': `token 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`,
            'Content-Type': 'application/json',
        }
    }
    const res = await axios.get(url, config)
    return res
})
*/
ipcMain.handle('fetch', async(event, url, options)=>{
    console.log('----- fetch -----')
    console.log(url)
    console.log(options)
    const res = await fetch(url, options).catch(e=>console.error(e));
    console.log(res)
    const json = await res.json()
    console.log(json)
    return json
})


/*
ipcMain.handle('delete', async(event, ids=null)=>{
    console.debug(ids)
    const isAll = (0===ids.length)
    const msg = ((isAll) ? `つぶやきをすべて削除します。` : `選択したつぶやきを削除します。`) + `\n本当によろしいですか？`
    if (confirm(msg)) {
        console.debug('削除します。')
        if (isAll) { console.debug('全件削除します。'); lib.get(`DB`).exec(`delete from comments;`) }
        else {
            console.debug('選択削除します。')
            lib.get(`DB`).exec(`begin;`)
            for (const id of ids) {
                lib.get(`DB`).exec(`delete from comments where id = ${id};`)
            }
            lib.get(`DB`).exec(`commit;`)
        }
        console.debug(await this.dexie.comments.toArray())
    }
})
*/


/*
ipcMain.handle('open', async (event) => {
    const { canceled, filePaths } = await dialog.showOpenDialog({
        filters: [{ name: 'Documents', extensions: ['txt'] }],
    })
    if (canceled) return { canceled, data: [] }
    const data = filePaths.map((filePath) =>
        fs.readFileSync(filePath, { encoding: 'utf8' })
    )
    return { canceled, data }
})
ipcMain.handle('save', async (event, data) => {
    const { canceled, filePath } = await dialog.showSaveDialog({
        filters: [{ name: 'Documents', extensions: ['txt'] }],
    })
    if (canceled) { return }
    fs.writeFileSync(filePath, data)
})
ipcMain.handle('shell', async (event, command) => {
    const exec = util.promisify(childProcess.exec);
    return await exec(command);
    //let result = await exec(command);
    //document.getElementById('result').value = result.stdout;
})
*/
