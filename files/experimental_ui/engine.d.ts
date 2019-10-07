

declare class ScriptEngine
{
    triggerEvent(data:string):void;
}

declare const engine:{
    BindingsReady(v1?:number, v2?:number, v3?:number, v4?:number):void,
    AddOrRemoveOnHandler(name:string, callback:(scriptEngine:ScriptEngine)=>void):void,
    TriggerEvent(name:string, triggers:string[]):void,
};
