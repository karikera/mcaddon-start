
import fs = require('fs');
import path = require('path');
import osLocale = require('os-locale');

function getEnvLocale():string
{
    const locale = osLocale.sync();
    if (locale)
    {
        const idx = locale.indexOf('.');
        if (idx === -1) return locale;
        return locale.substr(0, idx).replace(/-/g, '_');
    }
    return 'en_US';
}

const REGEX = /\$[0-9]?/g;

class LangItem
{
    private readonly msgs:string[];
    private readonly match:number[] = [];

    constructor(message:string)
    {
        this.msgs = [];
        
        REGEX.lastIndex = 0;
        let prev = 0;
        let idx = 0;
        let matched:RegExpExecArray|null;
        while ((matched = REGEX.exec(message)))
        {
            this.msgs.push(message.substring(prev, matched.index));

            const num = matched[0].charAt(1);
            this.match[idx] = num ? +num : idx;
            idx++;
            prev = REGEX.lastIndex;
        }
        this.msgs.push(message.substr(prev));
    }

    get text():string
    {
        return this.msgs[0];
    }

    toString():string
    {
        return this.msgs[0];
    }

    format(...params:any[]):string
    {
        let i=0;
        let out = '';
        for (;i<params.length;i++)
        {
            out += this.msgs[i];
            out += params[this.match[i]];
        }
        out += this.msgs[i];
        return out;
    }
}

interface Table
{
    [key:string]:Table&LangItem;
}

export const lang:Table = {};

function load(locale:string):void
{
    interface LoadedTable
    {
        [key:string]:LoadedTable&string;
    }

    function loadTo(table:Table, load:LoadedTable):void
    {
        for (const name in load)
        {
            const maintext = load[name];
            if (typeof maintext === 'string')
            {
                table[name] = new LangItem(maintext) as any;
                continue;
            }

            let dest = table[name];
            if (!dest || (dest instanceof LangItem))
            {
                dest = table[name] = {} as any;
            }
            loadTo(dest, maintext);
        }
    }
    
    try
    {
        const table:LoadedTable = JSON.parse(fs.readFileSync(path.join(__dirname, `../locale/${locale}.json`), 'utf-8'));
        loadTo(lang, table);
    }
    catch(err)
    {
    }
}

const locale = getEnvLocale();
load('en_US');
load(locale);

export function getLocaledFile(file:string):string
{
    const extidx = file.indexOf('.');
    let newfile:string;
    if (extidx === -1)
    {
        newfile = file + '.'+ locale;
    }
    else
    {
        newfile = file.substr(0, extidx+1) + locale + file.substr(extidx);
    }

    if (fs.existsSync(newfile))
    {
        return newfile;
    }
    else
    {
        return file;
    }
}

export function getSelectedLocale():string
{
    return locale;
}