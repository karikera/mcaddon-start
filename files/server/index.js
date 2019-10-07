/// <reference types="minecraft-scripting-types-server" />

const system = server.registerSystem(0, 0);

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

// event on entity created
system.listenForEvent("minecraft:entity_created", (data)=>{
    const entity = data.data.entity;
    message('EntityCreated: '+entity.__identifier__); // display message with entity identifier
});

