window.addEventListener('DOMContentLoaded', async(event) => {
    console.log('DOMContentLoaded!!');
    await window.myApi.loadDb(`src/db/mylog.db`)
    const db = new MyLogDb()
    Loading.setup()
    const setting = await Setting.load()
    console.log(setting)
    const maker = new SiteMaker(setting)
    await maker.make()
    /*
    if (setting?.mona?.address) { document.getElementById('address').value = setting.mona.address }
    if (setting?.github?.username) { document.getElementById('github-username').value =  setting?.github?.username }
    if (setting?.github?.token) { document.getElementById('github-token').value = setting?.github?.token }
    if (setting?.github?.repository) { document.getElementById('github-repository').value = setting?.github?.repository }
    const git = new Git(setting?.github)
    const hub = new GitHub(setting?.github)
    if (setting?.github?.repo) {
        console.log(`setting.github.repoは存在する`)
        console.log(setting?.github?.repo)
        document.getElementById('github-repo').value = setting.github.repo
        const exists = await git.init(document.getElementById('github-repo').value)
        if (!exists) {
            console.log(`リクエスト開始`)
            console.log(setting.github.username)
            console.log(setting.github.token)
            console.log(setting.github.repo)
            const res = await hub.createRepo({
                'name': `${setting.github.repo}`,
                'description': 'リポジトリの説明',
            }, setting)
            console.log(res)
        }
    }
    */
    document.querySelector('#push-test').addEventListener('click', async()=>{
        await git.push('追記', setting)
    })
    document.querySelector('#post').addEventListener('click', async()=>{
        document.getElementById('post-list').innerHTML = 
            db.insert(document.getElementById('content').value)
            + document.getElementById('post-list').innerHTML
    })
    document.querySelector('#delete').addEventListener('click', async()=>{
        const ids = Array.from(document.querySelectorAll(`#post-list input[type=checkbox][name=delete]:checked`)).map(d=>parseInt(d.value))
        console.debug(ids)
        await db.delete(ids)
        document.getElementById('post-list').innerHTML = await db.toHtml()
    })
    document.querySelector('#save-setting').addEventListener('click', async()=>{
        await Setting.save({
            mona:{address:document.getElementById('address').value},
            github:{
                username:document.getElementById('github-username').value,
                token:document.getElementById('github-token').value,
                repo:document.getElementById('github-repo').value,
            }
        })
        console.log(`設定ファイルを保存した`)
    })
    document.getElementById('post-list').innerHTML = await db.toHtml(document.getElementById('address').value)
    document.getElementById('content').focus()
    document.getElementById('content-length').textContent = db.LENGTH;
    /*
    document.querySelector('#download')?.addEventListener('click', async()=>{
        await downloader.download()
    })
    */
    /*
    document.querySelector('#save-setting').addEventListener('click', async()=>{
        await Setting.save(
            {
                mona:{address:document.getElementById('address').value},
                github:{
                    username:document.getElementById('github-username').value,
                    token:document.getElementById('github-token').value,
                    repository:document.getElementById('github-repository').value,
                }
            })
    })

    /*
    await window.myApi.loadDb(`src/db/mylog.db`)
    const db = new MyLogDb()
//    const downloader = new MyLogDownloader(db)
//    const uploader = new MyLogUploader(db, sqlFile)
    //const LENGTH = 140
    //const LINE = 15
    Loading.setup()
    const setting = await Setting.load()
    console.log(setting)
    console.log(setting?.mona?.address)
    //uploader.setup()
    if (setting?.mona?.address) { document.getElementById('address').value = setting.mona.address }
    if (setting?.github?.username) { document.getElementById('github-username').value =  setting?.github?.username }
    if (setting?.github?.token) { document.getElementById('github-token').value = setting?.github?.token }
    if (setting?.github?.repository) { document.getElementById('github-repository').value = setting?.github?.repository }
    const params = {
        params: {
            method: 'GET',
            url: `https://api.github.com/users/${setting.github.username}`,
            headers: {
                'Content-Type': 'application/json',
                Authorization: "Bearer " + setting.github.token,
            },
        },
        onData:async(json, res)=>{
            console.debug(res)
            console.debug(json)
        },
        onEnd:async(res)=>{
            console.debug(res)
        },
    }
    console.log(params)
    await window.myApi.request(params) // Uncaught (in promise) Error: An object could not be cloned.
    document.getElementById('post-list').innerHTML = await db.toHtml(document.getElementById('address').value)
    document.getElementById('content').focus()
    document.getElementById('content-length').textContent = db.LENGTH;
    document.querySelector('#post').addEventListener('click', async()=>{
        document.getElementById('post-list').innerHTML = 
            db.insert(document.getElementById('content').value)
            + document.getElementById('post-list').innerHTML
    })
    document.querySelector('#delete').addEventListener('click', async()=>{
        const ids = Array.from(document.querySelectorAll(`#post-list input[type=checkbox][name=delete]:checked`)).map(d=>parseInt(d.value))
        console.debug(ids)
        await db.delete(ids)
        document.getElementById('post-list').innerHTML = await db.toHtml()
    })
    */
    /*
    document.querySelector('#download')?.addEventListener('click', async()=>{
        await downloader.download()
    })
    */
    /*
    document.querySelector('#save-setting').addEventListener('click', async()=>{
        await Setting.save(
            {
                mona:{address:document.getElementById('address').value},
                github:{
                    username:document.getElementById('github-username').value,
                    token:document.getElementById('github-token').value,
                    repository:document.getElementById('github-repository').value,
                }
            })
    })
    */
})
