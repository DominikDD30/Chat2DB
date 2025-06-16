import {
  useState,
  useEffect,
  forwardRef,
  useImperativeHandle,
} from "react";
import type { DatabaseSchema } from "../types";

type Message = {
  role: "user" | "agent";
  content: string;
};

type Props = {
  currentDb: DatabaseSchema;
  onUpdateDb: (newDb: DatabaseSchema) => void;
};




export type ChatPanelHandle = {
  pushMessage: (content: string) => void;
};

const backendUrl = import.meta.env.VITE_BACKEND_URL;

const ChatPanel = forwardRef<ChatPanelHandle, Props>(
  ({ currentDb, onUpdateDb }, ref) => {
    const [messages, setMessages] = useState<Message[]>([
      {
        role: "agent",
        content:
          "Hello, I'm a chatbot that helps with creating database schemas. How can I help you?",
      },
    ]);
    const [input, setInput] = useState("");
    const [isTyping, setIsTyping] = useState(false);
    const [dots, setDots] = useState("");
    
    useEffect(() => {
      if (!isTyping) {
        setDots("");
        return;
      }

      const interval = setInterval(() => {
        setDots((prev) => (prev.length >= 3 ? "." : prev + "."));
      }, 500);

      return () => clearInterval(interval);
    }, [isTyping]);

    useImperativeHandle(ref, () => ({
      pushMessage: (content: string) => {
        setMessages((prev) => [
          ...prev,
          { role: "agent", content },
        ]);
      },
    }));

    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!input.trim()) return;

      const userMessage: Message = { role: "user", content: input.trim() };
      const updatedMessages = [...messages, userMessage];
      setMessages(updatedMessages);
      setInput("");
      setIsTyping(true);

      try {
        const res = await fetch(`${backendUrl}/generate/schema`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages: updatedMessages, 
            currentDb,
          }),
        });

        const data = await res.json();

        const agentMessage: Message = { role: "agent", content: data.response };
        setMessages((prev) => [...prev, agentMessage]);

        if (data.updatedDb) {
          onUpdateDb(data.updatedDb);
        }
      } catch (err) {
        console.error("API Error:", err);
        setMessages((prev) => [
          ...prev,
          {
            role: "agent",
            content: "An error occurred on the server side.",
          },
        ]);
      } finally {
        setIsTyping(false);
      }
    };


    return (
      <div className="flex flex-col h-full bg-white border-l border-gray-200">
        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {messages.map((msg, index) => (
            <div
              key={index}
              className={`flex ${
                msg.role === "user" ? "justify-start" : "justify-end"
              }`}
            >
              <div
                className={`max-w-[75%] px-4 py-2 rounded-2xl shadow-md text-sm ${
                  msg.role === "user"
                    ? "bg-blue-500 text-white rounded-bl-none"
                    : "bg-gray-100 text-gray-800 rounded-br-none"
                }`}
              >
                {msg.content}
              </div>
            </div>
          ))}

          {isTyping && (
            <div className="flex justify-end">
              <div className="text-md text-gray-400 italic">
                Agent is working{dots}
              </div>
            </div>
          )}
        </div>

        {/* Form */}
        <form
          onSubmit={handleSubmit}
          className="border-t border-gray-300 p-3 flex bg-gray-50"
        >
          <input
            type="text"
            className="flex-1 border border-gray-300 rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 transition-all"
            placeholder="Type your message..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
          />
          <button
            type="submit"
            className="ml-2 bg-blue-500 hover:bg-blue-600 text-white px-5 py-2 rounded-full text-sm transition-colors"
          >
            Send
          </button>
        </form>
      </div>
    );
  }
);

export default ChatPanel;
