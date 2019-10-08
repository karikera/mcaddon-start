/// <reference types="minecraft-scripting-types-server" />
/*<<<client*/
export {}; // {{lang.script.nothingExport}}/*>>>*/

const system = server.registerSystem(0, 0);

/**
 * {{lang.script.function.message.desc}}
 * @param msg {{lang.script.function.message.param.msg}}
 */
function message(msg:string):void
{
    const chat = system.createEventData(SendToMinecraftServer.DisplayChat);
    if (!chat) return;
    chat.data.message = msg;
    system.broadcastEvent(SendToMinecraftServer.DisplayChat, chat);
}

// {{lang.script.entity_created}}
system.listenForEvent(ReceiveFromMinecraftServer.EntityCreated, (data)=>{
    const entity = data.data.entity;
    message('EntityCreated: '+entity.__identifier__); // {{entity_created_msg}}
});

