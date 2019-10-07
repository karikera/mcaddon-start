# MCAddon Start
## What is This
This is Minecraft Addon project generator with **Webpack + Typescript**  

## How to Use
It can run on windows 10 only with Minecraft Win10 Edition  

First You need to install [VSCode](https://code.visualstudio.com/) and [NodeJS](https://nodejs.org/en/)

### Terminal process
You can open terminal with `Windows key -> cmd -> Enter` 
```sh
cd C:\path\to\projects ## Move to projects directory

npm i -g mcaddon-start  ## install mcaddon-start

mcaddon-start [project name]
## It will generate project directory and behavior pack with mcaddon-start
```
Open generated directory with VSCode  
And press `Ctrl + Shift + B` and select `Watch` to auto build  
You can modify script in `src/server/index.ts`  
It recommends to install [Typescript + Webpack Problem Matchers](https://marketplace.visualstudio.com/items?itemName=eamodio.tsl-problem-matcher)
