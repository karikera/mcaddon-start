/// <reference types="minecraft-scripting-types-client" />

const system = client.registerSystem(0, 0);

/**
 * {{lang.script.function.message.desc}}
 * @param msg {{lang.script.function.message.param.msg}}
 */
function message(msg)
{
    const chat = system.createEventData("minecraft:display_chat_event");
    if (!chat) return;
    chat.data.message = msg;
    system.broadcastEvent("minecraft:display_chat_event", chat);
}

// {{lang.script.hit_result_changed}}
system.listenForEvent("minecraft:hit_result_changed", (data)=>{
    const entity = data.data.entity;
    if (!entity) return;
    message('EntityHitResult: '+entity.__identifier__);// {{lang.script.hit_result_changed_msg}}
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