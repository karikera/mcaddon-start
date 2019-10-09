#!/usr/bin/env node

/// <reference path="open-file-explorer.d.ts" />

require('source-map-support').install();
import os = require('os');
import fs = require('fs');
import cp = require('child_process');
import path = require('path');
import validFilename = require('valid-filename');
import generateUuid = require('uuid/v4');
import { Questions } from './questions';

import openFileExplorer = require('open-file-explorer');

type AdmZip = import('adm-zip');
const AdmZip:{new():AdmZip} = require('adm-zip-fixcrc');
import { mkdir, mkdirr, getStdLine, templateCopy, copyAll } from './util';
import { lang, getLocaledFile, getSelectedLocale } from './lang';

const questions = new Questions;

function getMinePath():{behavior_packs:string, resource_packs:string}|null
{
    if (os.platform() !== 'win32') return null;
    const minepath = `${process.env.USERPROFILE}\\AppData\\Local\\Packages\\Microsoft.MinecraftUWP_8wekyb3d8bbwe\\LocalState\\games\\com.mojang`;
    if (!fs.existsSync(minepath)) return null;
    const behavior_packs = `${minepath}\\development_behavior_packs`;
    const resource_packs = `${minepath}\\development_resource_packs`;
    mkdir(behavior_packs);            
    mkdir(resource_packs);
    return {behavior_packs, resource_packs};
}

async function main():Promise<void>
{
    const win10path = getMinePath();
    switch (process.argv[2])
    {
    case '--locale':
        console.log(getSelectedLocale());
        return;
    case 'zip':
        console.error(lang.zip.deprecated.text);
    case '--zip':
        const src = process.argv[3];
        const dest = process.argv[4];
        if (!src || !dest)
        {
            console.error(lang.zip.noPath);
            console.error('mcaddon-start zip [src] [dest]');
            return;
        }
                
        const zip = new AdmZip();
        mkdirr(path.dirname(dest));
        zip.addLocalFolder(src);
        zip.writeZip(dest);
        return;
    case 'remove':
        console.error(lang.remove.deleted.text);
        return;
    case '--open-rp':
        if (!win10path)
        {
            console.error(lang.open.win10No.text);
            return;
        }
        openFileExplorer(win10path.resource_packs, err=>{
            if (!err) return;
            console.error('Error: '+ err.message);
            console.log('Resource Pack Path: ' + win10path.resource_packs);
        });
        return;
    case '--open-bp':
        if (!win10path)
        {
            console.error(lang.open.win10No.text);
            return;
        }
        openFileExplorer(win10path.behavior_packs, err=>{
            if (!err) return;
            console.error('Error: '+ err.message);
            console.log('Behavior Pack Path: ' + win10path.behavior_packs);
        });
        return;
    }

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
        console.log(lang.msg.putProjectName.text);
        packname = await getStdLine();
    }

    if (!validFilename(packname))
    {
        console.error(lang.msg.invalidFileName.format(packname));
        return;
    }

    let behavior_pack_path = '';
    let resource_pack_path = '';

    if (win10path)
    {
        behavior_pack_path = path.join(win10path.behavior_packs, packname);
        if (!force && fs.existsSync(behavior_pack_path))
        {
            console.error(lang.msg.behaviorPackAlreadyExists.format(packname));
            return;
        }
    }
    else
    {
        behavior_pack_path = 'behavior_pack_link';
    }

    if (!force && fs.existsSync(packname))
    {
        console.error(lang.msg.projectAlreadyExists.format(packname));
        return;
    }

    if (!win10path)
    {
        console.log(lang.msg.win10.no.text);
    }
    else
    {
        console.log(lang.msg.win10.yes.text);
    }
    console.log(''); // empty line
    
    useResourcePack = await questions.select(
        lang.questions.useResourcePack.text,
        useResourcePack,
        lang.useResourcePack.no.text,
        lang.useResourcePack.yes.text,
        lang.useResourcePack.yes_ui.text
    );
    const useUI = useResourcePack === 2;

    if (useResourcePack)
    {
        if (win10path)
        {
            resource_pack_path = path.join(win10path.resource_packs, packname);
            if (!force && fs.existsSync(resource_pack_path))
            {
                console.error(lang.msg.resourcePackAlreadyExists.format(packname));
                return;
            }
        }
        else
        {
            resource_pack_path = 'resource_pack_link';
        }
    }

    useJavascript = await questions.select(
        lang.questions.useJavascript.text,
        useJavascript,
        lang.useJavascript.no.text,
        lang.useJavascript.yes.text
    );

    const ext = useJavascript ? 'js' : 'ts';
    
    useClientScript = await questions.select(
        lang.questions.useClientScript.text,
        useClientScript,
        lang.useClientScript.no.text,
        lang.useClientScript.yes.text
    );
    
    mkdir(packname);
    process.chdir(packname);
    mkdir('.vscode');

    if (win10path)
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

    const source_path = path.join(path.join(__dirname, `../files/`));

    const templateVariables = {
        javascript:useJavascript,
        client:useClientScript,
        rp:useResourcePack,
        ui:useUI,
        ext:ext,
        name:packname,
        rp_uuid:generateUuid(),
        bp_uuid:generateUuid(),
        rp_path:behavior_pack_path,
        bp_path:resource_pack_path,
        data_uuid:generateUuid(),
        client_data_uuid:generateUuid(),
        resources_uuid:generateUuid(),
        lang
    };

    function copy(src:string, dest?:string):void
    {
        if (!dest) dest = src;
        src = path.join(source_path, src);
        try
        {
            fs.copyFileSync(getLocaledFile(src), dest);
        }
        catch (err)
        {
            console.error(lang.msg.copyFailed.format(dest, err.message));
        }
    }
    
    function tcopy(src:string, dest?:string):void
    {
        if (!dest) dest = src;
        src = path.join(source_path, src);
        try
        {
            templateCopy(getLocaledFile(src), dest, templateVariables);
        }
        catch (err)
        {
            console.error(lang.msg.copyFailed.format(dest, err.message));
        }
    }

    copy('tsconfig.json');
    copy('gitignore', '.gitignore');
    tcopy('package.json');
    tcopy('webpack.config.js');
    tcopy('tasks.json', '.vscode/tasks.json');

    copy('pack_icon.png', 'behavior_pack_link/pack_icon.png');
    tcopy('behavior_pack/manifest.json', 'behavior_pack_link/manifest.json');
    if (useResourcePack)
    {
        copy('pack_icon.png', 'resource_pack_link/pack_icon.png');
        tcopy('resource_pack/manifest.json', 'resource_pack_link/manifest.json');
    }
    
    mkdir('src');
    mkdir('src/server');
    
    if (useClientScript)
    {
        mkdir('src/client');
        tcopy(`client/index.${ext}`, `src/client/index.${ext}`);
    }

    if (useResourcePack && useUI)
    {
        await copyAll(path.join(source_path, 'experimental_ui'), 'resource_pack_link/experimental_ui');
    }

    tcopy(`server/index.${ext}`, `src/server/index.${ext}`);
    tcopy("README.md", 'README.md');
    
    console.log(lang.msg.generating.text);
    cp.execSync(`npm install`, {stdio:'inherit'});
    console.log(lang.msg.projectPath + process.cwd());
    if (behavior_pack_path) console.log(lang.msg.behaviorPath + behavior_pack_path);
    if (resource_pack_path) console.log(lang.msg.resourcePath + resource_pack_path);

    cp.exec('code .', err=>{});
}

main().catch(console.error);

