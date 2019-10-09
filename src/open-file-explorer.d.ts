
declare module "open-file-explorer"
{
    function openFileExplorer(path:string, callback:(err?:Error)=>void):void;
    export = openFileExplorer;
}
