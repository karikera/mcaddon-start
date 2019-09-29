#!/usr/bin/env node

require('source-map-support').install();
import fs = require('fs');
import cp = require('child_process');
import path = require('path');
import validFilename = require('valid-filename');
import generateUuid = require('uuid/v1');

function getStdLine():Promise<string>
{
    return new Promise<string>((resolve)=>{
        function input(data:Buffer):void
        {
            process.stdin.removeListener('data', input);
            process.stdin.pause();
            resolve(data.toString('utf-8'));
        }
        process.stdin.on('data', input);
    });
}

function mkdir(path:string):void
{
    try
    {
        fs.mkdirSync(path);
    }
    catch(err)
    {
    }
}

function mkdirRecursive(path:string):void
{
    try
    {
        fs.mkdirSync(path, {recursive: true});
    }
    catch(err)
    {
    }
}

function writeJsonFile(path:string, text:unknown):void
{
    fs.writeFileSync(path, JSON.stringify(text, null, 4), 'utf-8');
}

function templateCopy(src:string, dest:string, vars:{[key:string]:string}):void
{
    const content = fs.readFileSync(src, 'utf-8');
    fs.writeFileSync(dest, content.replace(/{{([^}]+)}}/g, (_, matched)=>vars[matched]), 'utf-8');
}

async function main():Promise<void>
{
    const minepath = `${process.env.USERPROFILE}\\AppData\\Local\\Packages\\Microsoft.MinecraftUWP_8wekyb3d8bbwe\\LocalState\\games\\com.mojang`;
    if (!fs.existsSync(minepath))
    {
        console.error('Minecraft Windows 10 Edition not found');
        return;
    }

    const behavior_packs = minepath+'\\development_behavior_packs';
    mkdir(behavior_packs);

    console.log('It will generate project folder and behavior pack.');
    let force = false;
    let packname = '';
    for (let i=2;i<process.argv.length;i++)
    {
        const arg = process.argv[i];
        if (arg.startsWith('-'))
        {
            switch (arg.substr(1))
            {
            case 'f': force = true; break;
            }
        }
        else
        {
            packname = arg;
        }
    }
    if (!packname)
    {
        console.log(`Please enter name of project>`);
        packname = await getStdLine();
    }

    if (!validFilename(packname))
    {
        console.error(`Invalid file name: ${packname}`);
        return;
    }

    const packpath = behavior_packs + '\\'+packname;
    if (!force && fs.existsSync(packpath))
    {
        console.error(`behavior pack ${packname} exists already.`);
        return;
    }

    if (!force && fs.existsSync(packname))
    {
        console.error(`${packname} directory exists already.`);
        return;
    }

    console.log('generating...');
    
    mkdir(packname);
    process.chdir(packname);
    mkdir('.vscode');

    mkdir(packpath);
    try
    {
        cp.execSync(`mklink /J "outlink" "${packpath}"`, {stdio:'pipe'});
    }
    catch(err)
    {
    }
    const packagejson = {
        "name": packname,
        "version": "0.0.1",
        "description": packname + " package description",
        "scripts": {
          "test": "echo \"Error: no test specified\" && exit 1"
        },
        "keywords": [],
        "author": "",
        "license": "ISC",
        "dependencies": {
            "webpack": "^4.39.3",
            "webpack-cli": "^3.3.9",
            "minecraft-scripting-types-client": "^1.0.0",
            "minecraft-scripting-types-server": "^1.0.0",
            "ts-loader": "^6.0.4",
            "typescript": "^3.6.2",
        }
    };
    writeJsonFile('package.json', packagejson);
    cp.execSync(`npm install`);
    fs.copyFileSync(path.join(__dirname, '../files/tsconfig.json'), `tsconfig.json`);
    fs.copyFileSync(path.join(__dirname, '../files/webpack.config.js'), `webpack.config.js`);
    
    templateCopy(path.join(__dirname, '../files/tasks.json'), `.vscode/tasks.json`, {
        name:packname,
    });
    templateCopy(path.join(__dirname, '../files/manifest.json'), `outlink/manifest.json`, {
        name:packname,
        uuid:generateUuid(),
    });
    mkdirRecursive('src/server');
    fs.copyFileSync(path.join(__dirname, '../files/server/index.ts'), 'src/server/index.ts');
    fs.copyFileSync(path.join(__dirname, '../files/README.md'), 'README.md');

    console.log('generate project: '+process.cwd());
    console.log('generate pack: '+packpath);

    cp.exec('code .', err=>{});
}

main().catch(console.error);

