/// <reference path="./engine.d.ts" />

engine.BindingsReady();

/** @type {ScriptEngine} */
let scriptEngineHandle = null;
engine.AddOrRemoveOnHandler('facet:updated:core.scripting', scriptEngine=>{
    scriptEngineHandle = scriptEngine;
}, engine);
engine.TriggerEvent("facet:request", ["core.scripting"]);

const startButton = document.getElementById("_start_");
startButton.addEventListener("click", ()=>{
    scriptEngineHandle.triggerEvent("startPressed");
});
