/// <reference types="minecraft-scripting-types-server" />

const system = server.registerSystem(0, 0);

/**
 * {{lang.script.function.message.desc}}
 * @param {string} msg {{lang.script.function.message.param.msg}}
 */
function message(msg)
{
    const chat = system.createEventData("minecraft:display_chat_event");
    if (!chat) return;
    chat.data.message = msg;
    system.broadcastEvent("minecraft:display_chat_event", chat);
}

// {{lang.script.entity_created}}
system.listenForEvent("minecraft:entity_created", (data)=>{
    const entity = data.data.entity;
    message('EntityCreated: '+entity.__identifier__); // {{entity_created_msg}}
});

