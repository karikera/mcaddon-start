#!/usr/bin/env node

require('source-map-support').install();
import fs = require('fs');
import cp = require('child_process');
import path = require('path');
import validFilename = require('valid-filename');
import generateUuid = require('uuid/v1');
import cliSelect = require('cli-select');
import { ncp } from 'ncp';

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

class TextParser
{
    out:string = '';
    idx:number = 0;
    content:string = '';

    constructor()
    {
    }

    passTo(needle:string):void
    {
        const startidx = this.content.indexOf(needle, this.idx);
        if (startidx === -1)
        {
            this.out += this.content.substr(this.idx);
            throw 0;
        }
        this.out += this.content.substring(this.idx, startidx);
        this.idx = startidx + needle.length;
    }

    readTo(needle:string):string
    {
        const startidx = this.content.indexOf(needle, this.idx);
        if (startidx === -1)
        {
            throw 0;
        }
        const res = this.content.substring(this.idx, startidx);
        this.idx = startidx + needle.length;
        return res;
    }

    readBetween(a:string, b:string):string
    {
        this.passTo(a);
        return this.readTo(b);
    }


}

function templateCopy(src:string, dest:string, vars:{[key:string]:(string|boolean|number)}):void
{
    const out = fs.createWriteStream(dest, 'utf-8');
    
    const parser = new TextParser;
    parser.content = fs.readFileSync(src, 'utf-8');

    try
    {
        for (;;)
        {
            const name = parser.readBetween('/*<<<', '*/');
            let condition:boolean;
            if (name.startsWith('!'))
            {
                condition = !vars[name.substr(1)];
            }
            else
            {
                condition = !!vars[name];
            }
            
            if (condition) parser.passTo('/*>>>*/');
            else parser.readTo('/*>>>*/');
        }
    }
    catch (err)
    {
        if (err !== 0) throw err;
    }
    parser.content = parser.out;
    parser.out = '';
    parser.idx = 0;
    
    try
    {
        for (;;)
        {
            const name = parser.readBetween('{{', '}}');
            parser.out += vars[name];
        }
    }
    catch (err)
    {
        if (err !== 0) throw err;
    }

    fs.writeFileSync(dest, parser.out, 'utf-8');
}

async function select(preselect:number|null,...values:string[]):Promise<number>
{
    if (preselect !== null)
    {
        console.log(values[preselect]);
        return preselect;
    }
    const res = await cliSelect({defaultValue:0, values});
    console.log(res.value);
    return res.id as number;
}

async function main():Promise<void>
{
    const minepath = `${process.env.USERPROFILE}\\AppData\\Local\\Packages\\Microsoft.MinecraftUWP_8wekyb3d8bbwe\\LocalState\\games\\com.mojang`;
    let win10Exists = fs.existsSync(minepath);
    let useClientScript:number|null = null;
    let useResourcePack:number|null = null;
    let useJavascript:number|null = null;

    if (!win10Exists)
    {
        console.error('Minecraft Windows 10 Edition not found');
        console.error('It will generate project directory only');
    }
    else
    {
        console.log('It will generate project directory and behavior pack');
    }

    let force = false;
    let packname = '';
    for (let i=2;i<process.argv.length;i++)
    {
        const arg = process.argv[i];
        if (arg.startsWith('-'))
        {
            const code = arg.substr(1);
            switch (code)
            {
            case 'f': force = true; break;
            default:
                if (/^[rlc][0-9]$/.test(code))
                {
                    switch(code.charAt(0))
                    {
                    case 'r': useResourcePack = +code.charAt(1); break;
                    case 'l': useJavascript = +code.charAt(1); break;
                    case 'c': useClientScript = +code.charAt(1); break;
                    }
                }
                else
                {
    
                }
                break;
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

    
    let behavior_pack_path = '';
    let resource_pack_path = '';

    if (win10Exists)
    {
        const behavior_packs = `${minepath}\\development_behavior_packs`;
        mkdir(behavior_packs);

        behavior_pack_path = `${behavior_packs}\\${packname}`;
        if (!force && fs.existsSync(behavior_pack_path))
        {
            console.error(`behavior pack ${packname} exists already.`);
            return;
        }
    }

    if (!force && fs.existsSync(packname))
    {
        console.error(`${packname} directory exists already.`);
        return;
    }

    console.log('(1/3)Resource pack>');
    useResourcePack = await select(
        useResourcePack,
        'No Resource Pack',
        'Generate Resource Pack',
        'Generate Resource Pack with UI'
    );
    const useUI = useResourcePack === 2;

    if (useResourcePack)
    {
        const resource_packs = `${minepath}\\development_resource_packs`;
        mkdir(resource_packs);
        
        resource_pack_path = `${resource_packs}\\${packname}`;
        if (!force && fs.existsSync(resource_pack_path))
        {
            console.error(`resource pack ${packname} exists already.`);
            return;
        }
    }

    console.log('(2/3)Please select language>');
    useJavascript = await select(
        useJavascript,
        'TypeScript(Recommended)',
        'JavaScript'
    );

    const ext = useJavascript ? 'js' : 'ts';
    
    console.log('(3/3)Please select target>');
    useClientScript = await select(
        useClientScript,
        'Server Script Only',
        'Server Script + Client Script'
    );
    
    console.log('generating...');

    mkdir(packname);
    process.chdir(packname);
    mkdir('.vscode');

    if (win10Exists)
    {
        if (useResourcePack)
        {
            mkdir(resource_pack_path);
            try
            {
                cp.execSync(`mklink /J "resource_pack_link" "${resource_pack_path}"`, {stdio:'pipe'});
            }
            catch(err)
            {
            }
        }
        try
        {
            mkdir(behavior_pack_path);
            cp.execSync(`mklink /J "behavior_pack_link" "${behavior_pack_path}"`, {stdio:'pipe'});
        }
        catch(err)
        {
        }
    }
    else
    {
        mkdir("behavior_pack_link");
        if (useResourcePack) mkdir("resource_pack_link");
    }

    const files = path.join(path.join(__dirname, `../files/`));
    
    templateCopy(path.join(files, 'package.json'), `package.json`, {
        javascript:useJavascript,
        client:useClientScript,
    });
    
    fs.copyFileSync(path.join(files, '../files/tsconfig.json'), `tsconfig.json`);

    templateCopy(path.join(files, `webpack.config.js`), `webpack.config.js`, {
        javascript:useJavascript,
        client:useClientScript,
        ext:ext,
    });
    
    templateCopy(path.join(files, 'tasks.json'), `.vscode/tasks.json`, {
        name:packname,
    });
    const bp_uuid = generateUuid();
    const rp_uuid = generateUuid();
    fs.copyFileSync(path.join(files, 'pack_icon.png'), `behavior_pack_link/pack_icon.png`);
    templateCopy(path.join(files, 'behavior_pack/manifest.json'), `behavior_pack_link/manifest.json`, {
        name:packname,
        rp_uuid,
        bp_uuid,
        data_uuid:generateUuid(),
        client_data_uuid:generateUuid(),
        javascript:useJavascript,
        client:useClientScript,
        rp:useResourcePack
    });
    if (useResourcePack)
    {
        fs.copyFileSync(path.join(files, 'pack_icon.png'), `resource_pack_link/pack_icon.png`);
        templateCopy(path.join(files, 'resource_pack/manifest.json'), `resource_pack_link/manifest.json`, {
            name:packname,
            rp_uuid,
            bp_uuid,
            resources_uuid:generateUuid(),
            javascript:ext === 'js',
            client:useClientScript,
            ui:useUI
        });
    }
    
    mkdir('src');
    mkdir('src/server');
    
    if (useClientScript)
    {
        mkdir('src/client');
        templateCopy(path.join(files, `client/index.${ext}`), `src/client/index.${ext}`,{
            ui:useUI
        });
    }

    if (useResourcePack && useUI)
    {
        await new Promise((resolve, reject)=>{
            ncp(path.join(files, 'experimental_ui'), 'resource_pack_link/experimental_ui', err=>{
                if (err) reject(err);
                else resolve();
            });
        });
    }

    templateCopy(path.join(files, `server/index.${ext}`), `src/server/index.${ext}`,{
        ui:useUI
    });
    fs.copyFileSync(path.join(files, 'README.md'), 'README.md');
    
    cp.execSync(`npm install`, {stdio:'pipe'});
    console.log('Generated Project: '+process.cwd());
    if (behavior_pack_path) console.log('Generated Behavior Pack: '+behavior_pack_path);
    if (resource_pack_path) console.log('Generated Resource Pack: '+resource_pack_path);

    cp.exec('code .', err=>{});
}

main().catch(console.error);

