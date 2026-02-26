import React from "react";
import { Static } from "ink";
import { Message, type MessageData } from "./Message.js";

interface ChatHistoryProps {
  messages: MessageData[];
}

export function ChatHistory({ messages }: ChatHistoryProps) {
  return <Static items={messages}>{(msg, index) => <Message key={index} {...msg} />}</Static>;
}
