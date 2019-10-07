#!/usr/bin/env node

require('source-map-support').install();
import fs = require('fs');
import cp = require('child_process');
import path = require('path');
import validFilename = require('valid-filename');
import generateUuid = require('uuid/v1');
import rimraf = require('rimraf');
import { ncp } from 'ncp';
import { Questions } from './questions';
import AdmZip = require('adm-zip');

// TODO: want to add make npm module option

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


const questions = new Questions;


async function main():Promise<void>
{
    const minepath = `${process.env.USERPROFILE}\\AppData\\Local\\Packages\\Microsoft.MinecraftUWP_8wekyb3d8bbwe\\LocalState\\games\\com.mojang`;
    let win10Exists = fs.existsSync(minepath);

    const behavior_packs = `${minepath}\\development_behavior_packs`;
    const resource_packs = `${minepath}\\development_resource_packs`;

    if (win10Exists)
    {
        mkdir(behavior_packs);            
        mkdir(resource_packs);
    }

    if (process.argv[2] === 'zip')
    {
        const src = process.argv[3];
        const dest = process.argv[4];
        if (!src || !dest)
        {
            console.error('It needs a zip path');
            console.error('mcaddon-start zip [src] [dest]');
            return;
        }
                
        const zip = new AdmZip();
        zip.addLocalFolder(src);
        zip.writeZip(dest);
        return;
    }
    else if (process.argv[2] === 'remove')
    {
        if (!win10Exists)
        {
            console.error('Minecraft Windows 10 Edition not found');
            return;
        }
        for (;;)
        {
            const list1 = fs.readdirSync(behavior_packs).map(v=>'(behavior)'+v);
            const list2 = fs.readdirSync(resource_packs).map(v=>'(resource)'+v);
            const files = list1.concat(list2).concat(['exit']);

            const selected = await questions.select('Select to remove>', null, ...list1.concat(list2).concat(['exit']));
            const file = files[selected];
            if (file === 'exit') break;
            const dirname = file.substr(10);
            try
            {
                switch (file.substr(0, 10))
                {
                case '(behavior)': rimraf.sync(path.join(behavior_packs, dirname)); break;
                case '(resource)': rimraf.sync(path.join(resource_packs, dirname)); break;
                }
                console.log(`${file} is removed`);
            }
            catch (err)
            {
                console.error(`${file} removing failed`);
                console.error(err.message);
            }
        }
        return;
    }

    if (!win10Exists)
    {
        console.error('Minecraft Windows 10 Edition not found');
        console.error('It will generate project directory only');
    }
    else
    {
        console.log('It will generate project directory and behavior pack');
    }
    console.log('');

    
    let useClientScript:number|null = null;
    let useResourcePack:number|null = null;
    let useJavascript:number|null = null;

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
        behavior_pack_path = `${behavior_packs}\\${packname}`;
        if (!force && fs.existsSync(behavior_pack_path))
        {
            console.error(`behavior pack ${packname} exists already.`);
            return;
        }
    }
    else
    {
        behavior_pack_path = 'behavior_pack';
    }

    if (!force && fs.existsSync(packname))
    {
        console.error(`${packname} directory exists already.`);
        return;
    }


    useResourcePack = await questions.select(
        '(1/3) Resource pack>',
        useResourcePack,
        'No Resource Pack',
        'Generate Resource Pack',
        'Generate Resource Pack with UI'
    );
    const useUI = useResourcePack === 2;

    if (useResourcePack)
    {
        if (win10Exists)
        {
            resource_pack_path = `${resource_packs}\\${packname}`;
            if (!force && fs.existsSync(resource_pack_path))
            {
                console.error(`resource pack ${packname} exists already.`);
                return;
            }
        }
        else
        {
            resource_pack_path = 'resource_pack';
        }
    }

    useJavascript = await questions.select(
        '(2/3) Please select language>',
        useJavascript,
        'TypeScript(Recommended)',
        'JavaScript'
    );

    const ext = useJavascript ? 'js' : 'ts';
    
    useClientScript = await questions.select(
        '(3/3) Please select target>',
        useClientScript,
        'Server Script Only',
        'Server Script + Client Script'
    );
    
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
                cp.execSync(`mklink /J "resource_pack_link" "${resource_pack_path}"`, {stdio:'ignore'});
            }
            catch(err)
            {
            }
        }
        try
        {
            mkdir(behavior_pack_path);
            cp.execSync(`mklink /J "behavior_pack_link" "${behavior_pack_path}"`, {stdio:'ignore'});
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
    
    fs.copyFileSync(path.join(files, 'tsconfig.json'), `tsconfig.json`);
    fs.copyFileSync(path.join(files, '.gitignore'), `.gitignore`);

    templateCopy(path.join(files, 'package.json'), `package.json`, {
        javascript:useJavascript,
        client:useClientScript,
    });
    
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
    
    console.log(`npm install`);
    cp.execSync(`npm install`, {stdio:'inherit'});
    console.log('Project Path:  '+process.cwd());
    if (behavior_pack_path) console.log('Behavior Pack: '+behavior_pack_path);
    if (resource_pack_path) console.log('Resource Pack: '+resource_pack_path);

    cp.exec('code .', err=>{});
}

main().catch(console.error);

