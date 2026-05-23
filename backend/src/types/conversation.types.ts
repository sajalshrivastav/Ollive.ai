export interface CreateConversationBody{
    title?:string;
}

export interface SendMessageBody{
    conversationId:string,
    message:string;
    model:string;
    provider:string;
    stream?:boolean
}