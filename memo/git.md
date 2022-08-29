# git pushエラー

```
Uncaught (in promise) Error: Error invoking remote method 'shell': Error: Command failed: git push origin master
fatal: not a git repository (or any parent up to mount point /)
Stopping at filesystem boundary (GIT_DISCOVERY_ACROSS_FILESYSTEM not set).
```

# github.js

## init

```
git init
git remote add origin "https://${this.username}:${this.token}@github.com/${this.username}/${this.repo}.git"
https://docs.github.com/ja/rest/repos/repos#create-a-repository-for-the-authenticated-user
```

## push

```
git config --global user.name '${username}'
git config --global user.email '${email}'
```
```
git add .
git commit -m '${message}'
git push origin ${this.branch}
```

　`push`のところで以下エラーが出る。原因は`git remote add origin $URL`できていないこと。

```
Uncaught (in promise) Error: Error invoking remote method 'shell': Error: Command failed: cd "dst/mytestrepo"; git push origin master
fatal: 'origin' does not appear to be a git repository
fatal: Could not read from remote repository.

Please make sure you have the correct access rights
and the repository exists.
```

　`push`のところで以下エラーが出る。原因はpushの直前でカレントディレクトリをリポジトリにしなかったこと。

```
Uncaught (in promise) Error: Error invoking remote method 'shell': Error: Command failed: git push origin master
fatal: not a git repository (or any parent up to mount point /)
Stopping at filesystem boundary (GIT_DISCOVERY_ACROSS_FILESYSTEM not set).
```


