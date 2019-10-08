/// <reference types="minecraft-scripting-types-client" />

export {}; // {{lang.script.nothingExport}}

const system = client.registerSystem(0, 0);

/**
 * {{lang.script.function.message.desc}}
 * @param msg {{lang.script.function.message.param.msg}}
 */
function message(msg:string):void
{
    const chat = system.createEventData(SendToMinecraftClient.DisplayChat);
    if (!chat) return;
    chat.data.message = msg;
    system.broadcastEvent(SendToMinecraftClient.DisplayChat, chat);
}

// {{lang.script.hit_result_changed}}
system.listenForEvent(ReceiveFromMinecraftClient.HitResultChanged, (data)=>{
    const entity = data.data.entity;
    if (!entity) return;
    message('EntityHitResult: '+entity.__identifier__); // {{lang.script.hit_result_changed_msg}}
});
/*<<<ui*/
system.listenForEvent(ReceiveFromMinecraftClient.UIEvent, ev=>{
    message(ev.data);
    if (ev.data === 'startPressed')
    {
        const data = system.createEventData(SendToMinecraftClient.UnloadUI);
        data!.data.path = 'sample.html';
        system.broadcastEvent(SendToMinecraftClient.UnloadUI, data!);
    }
});

system.listenForEvent(ReceiveFromMinecraftClient.ClientEnteredWorld, ev=>{
    const data = system.createEventData(SendToMinecraftClient.LoadUI);
    data!.data.path = 'sample.html';
    system.broadcastEvent(SendToMinecraftClient.LoadUI, data!);
});
/*>>>*/