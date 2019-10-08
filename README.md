# MCAddon Start
## What is This
This is Minecraft Addon project generator with **Webpack + Typescript**  
  
Read this in other languages: [English](README.md), [한국어](README.ko_KR.md)

## How to Use
![alt text](readme-image/render.gif)

* Step 1
Install [VSCode](https://code.visualstudio.com/) and [NodeJS](https://nodejs.org/en/)
* Step 2
Open Terminal - You can open terminal with `Windows key + R -> cmd -> Enter` on Windows  
And run below command from terminal
```sh
cd C:\path\to\projects ## Move to projects directory. This path is fake, write own path
npm i -g mcaddon-start  ## install mcaddon-start
mcaddon-start [project name] ## It will generate project and packs
```
* Step 3
Open generated directory with VSCode(It will automatically open, If you allow to use `code` command)  
Press `Ctrl + Shift + B` and select `Watch` to auto build  
You can modify script in `src/server/index.ts`  
It recommends to install [Typescript + Webpack Problem Matchers](https://marketplace.visualstudio.com/items?itemName=eamodio.tsl-problem-matcher)
