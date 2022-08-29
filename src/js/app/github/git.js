class Git {
    constructor(opt=null) {
        this.dir = `dst`
        this.username = opt?.username
        this.token = opt?.token
        this.repo = opt?.repo
        this.branch = `master`
        console.log(opt)
    }
    async init(repo) {
        console.log('Git.init()')
        this.repo = repo
        const exists = await window.myApi.exists(`${this.dir}/${this.repo}/.git`)
        console.log(exists)
        if(!exists) {
            await window.myApi.mkdir(`${this.dir}/${this.repo}`)
            let res = await window.myApi.shell(`cd "${this.dir}/${this.repo}/"; git init;`)
            //let res = await window.myApi.shell(`cd "${this.dir}/"; mkdir "${this.repo}"; cd "${this.repo}"; git init;`)
            // Initialized empty Git repository in /tmp/work/Electron.GitHub.API.20220816131521/dst/mytestrepo/.git/
            console.log(res.stdout)
            console.log(`ローカルリポジトリを作成しました。`)
            res = await this.#remoteAddOrigin()
            console.log(res.stdout)
        } else {
            console.log(`${this.dir}/${this.repo}/.git は既存のためgit initしません。`)
        }
        return exists
    }
    async push(message='追記', setting) {
        let res = await window.myApi.shell(`cd "${this.dir}/${this.repo}"; echo 'test file.' >| test.txt;`)
        console.log(res.stdout)
        res = await this.#setUser(setting.github.username, setting.github.email)
        console.log(res.stdout)
        res = await this.#add()
        console.log(res.stdout)
        res = await this.#commit(message)
        console.log(res.stdout)
        res = await this.#push()
        console.log(res.stdout)
    }
    // これやらないとcommit時以下エラーになる
    // Uncaught (in promise) Error: Error invoking remote method 'shell': Error: Command failed: git push origin master
    // fatal: not a git repository (or any parent up to mount point /)
    // Stopping at filesystem boundary (GIT_DISCOVERY_ACROSS_FILESYSTEM not set).
    async #setUser(username, email, isLocal=false) {
        //const opt = '--' + ((isLocal) ? 'global' : 'local')
        //const opt = '--' + ((true==isLocal) ? 'global' : 'local')
        //console.log('setUser():', username, email, isLocal, opt)
        //console.log('setUser():', username, email, isLocal, ((isLocal) ? 'global' : 'local'), opt)
        //await window.myApi.shell(`git config ${opt} user.name '${username}'`)
        //await window.myApi.shell(`git config ${opt} user.email '${email}'`)
        console.log('setUser():', username, email)
        let res = await window.myApi.shell(`git config --global user.name '${username}'`).stdout
        //console.log(res.stdout)
        res += '\n' + await window.myApi.shell(`git config --global user.email '${email}'`).stdout
        //console.log(res.stdout)
        return res
    }
    async #add() {
        return await window.myApi.shell(`cd "${this.dir}/${this.repo}"; git add .;`)
    }
    async #addList() {
        return await window.myApi.shell(`cd "${this.dir}/${this.repo}"; git add -n .;`)
    }
    async #commit(message) {
        return await window.myApi.shell(`cd "${this.dir}/${this.repo}"; git commit -m '${message}';`)
    }
    async #remoteAddOrigin() {
        return await window.myApi.shell(`cd "${this.dir}/${this.repo}"; git remote add origin "https://${this.username}:${this.token}@github.com/${this.username}/${this.repo}.git";`)
    }
    async #remoteSetUrlOrigin() {
        return await window.myApi.shell(`cd "${this.dir}/${this.repo}"; git remote set-url origin "https://${this.username}:${this.token}@github.com/${this.username}/${this.repo}.git";`)
    }
    async #push() {
        return await window.myApi.shell(`cd "${this.dir}/${this.repo}"; git push origin ${this.branch}`)
    }

    /*
    async push(options) {
        // リポジトリがなければ作成する(init)
        // add, commit, push
        let res = await window.myApi.shell(`cd ./repo/${options.repository}`)
        console.debug(res.stdout)
        this.#init()
    }
    async #add() {
        await window.myApi.shell(`git add .`)
    }
    async #addList() {
        await window.myApi.shell(`git add -n .`)
    }
    async #commit(message) {
        await window.myApi.shell(`git commit -m '${message}'`)
    }
    async #remoteAddOrigin() {
        await window.myApi.shell(`git remote add origin "https://${username}:${token}@github.com/${username}/${repo}.git"`)
    }
    async #remoteSetUrlOrigin() {
        await window.myApi.shell(`git remote set-url origin "https://${username}:${token}@github.com/${username}/${repo}.git"`)
    }
    async #push() {
        await window.myApi.shell(`git push origin ${this.branch}`)
    }
    async #setUser(username, email, isLocal=false) {
        const opt = '--' + ((isLocal) ? 'global' : 'local')
        await window.myApi.shell(`git config ${opt} user.name '${username}'`)
        await window.myApi.shell(`git config ${opt} user.email '${email}'`)
    }
    */
}
