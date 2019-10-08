
import { ncp } from 'ncp';
import fs = require('fs');

export function getStdLine():Promise<string>
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

export function mkdir(path:string):void
{
    try
    {
        fs.mkdirSync(path);
    }
    catch(err)
    {
    }
}

export function mkdirr(path:string):void
{
    try
    {
        fs.mkdirSync(path, {recursive: true});
    }
    catch(err)
    {
    }
}

export class TextParser
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

function followObject(obj:{[key:string]:any}, keys:string):any
{
    for (const key of keys.split('.'))
    {
        obj = obj[key];
    }
    return obj;
}

export function templateCopy(src:string, dest:string, vars:{[key:string]:unknown}):void
{
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
                condition = !followObject(vars, name.substr(1));
            }
            else
            {
                condition = !!followObject(vars, name);
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
            parser.out += followObject(vars, name);
        }
    }
    catch (err)
    {
        if (err !== 0) throw err;
    }

    fs.writeFileSync(dest, parser.out, 'utf-8');
}

export function copyAll(src:string, dest:string):Promise<void>
{
    return new Promise((resolve, reject)=>{
        ncp(src, dest, err=>{
            if (err) reject(err);
            else resolve();
        });
    });
}
