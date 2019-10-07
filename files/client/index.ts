/// <reference types="minecraft-scripting-types-client" />

export {}; // nothing, avoid to use global scope without import anything

const system = client.registerSystem(0, 0);

/**
 * Display message function
 * @param msg Message to display
 */
function message(msg:string):void
{
    const chat = system.createEventData(SendToMinecraftClient.DisplayChat);
    if (!chat) return;
    chat.data.message = msg;
    system.broadcastEvent(SendToMinecraftClient.DisplayChat, chat);
}

// event on hit result changed
system.listenForEvent(ReceiveFromMinecraftClient.HitResultChanged, (data)=>{
    const entity = data.data.entity;
    if (!entity) return;
    message('EntityHitResult: '+entity.__identifier__); // display message with entity identifier
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