/// <reference types="minecraft-scripting-types-server" />

const system = server.registerSystem(0, 0);

/**
 * Display message function
 * @param msg Message to display
 */
function message(msg:string):void
{
    const chat = system.createEventData(SendToMinecraftServer.DisplayChat);
    if (!chat) return;
    chat.data.message = msg;
    system.broadcastEvent(SendToMinecraftServer.DisplayChat, chat);
}

// event on entity created
system.listenForEvent(ReceiveFromMinecraftServer.EntityCreated, (data)=>{
    const entity = data.data.entity;
    message('EntityCreated: '+entity.__identifier__); // display message with entity identifier
});

