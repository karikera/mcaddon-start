/// <reference types="minecraft-scripting-types-client" />

const system = client.registerSystem(0, 0);

/**
 * Display message function
 * @param {string} msg Message to display
 */
function message(msg)
{
    const chat = system.createEventData("minecraft:display_chat_event");
    if (!chat) return;
    chat.data.message = msg;
    system.broadcastEvent("minecraft:display_chat_event", chat);
}

// event on hit result changed
system.listenForEvent("minecraft:hit_result_changed", (data)=>{
    const entity = data.data.entity;
    message('EntityCreated: '+entity.__identifier__); // display message with entity identifier
});
/*<<<ui*/
system.listenForEvent("minecraft:ui_event", ev=>{
    message(ev.data);
    if (ev.data === 'startPressed')
    {
        const data = system.createEventData("minecraft:unload_ui");
        data.data.path = 'test.html';
        system.broadcastEvent("minecraft:unload_ui", data);
    }
});

system.listenForEvent("minecraft:client_entered_world", ev=>{
    const data = system.createEventData("minecraft:load_ui");
    data.data.path = 'test.html';
    system.broadcastEvent("minecraft:load_ui", data);
});
/*>>>*/