import {Message, OpenAIModel} from "@/types";
import {createParser, ParsedEvent, ReconnectInterval} from "eventsource-parser";
import {seatbeltPolicy} from "@/utils/data/seatbelt-policy";
import {useOfForce} from "@/utils/data/use-of-force";

export const OpenAIStream = async (messages: Message[]) => {
    const encoder = new TextEncoder();
    const decoder = new TextDecoder();

    const res = await fetch("https://api.openai.com/v1/chat/completions", {
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${process.env.OPENAI_API_KEY}`
        },
        method: "POST",
        body: JSON.stringify({
            model: 'gpt-4-0125-preview',
            messages: [
                {
                    role: "system",
                    content: `You are a question answering service that answers a single question about policies regarding the San Francisco police department. Only derive your answer from the following policy. Do not use any outside information. If you are not sure say "I don't know.". Do not make up any answers. I will tip extra for accurate information. 
                    
                    Policy:
                    ${useOfForce}
                    `
                },
                ...messages
            ],
            max_tokens: 800,
            temperature: 0.0,
            stream: true
        })
    });

    if (res.status !== 200) {
        throw new Error("OpenAI API returned an error");
    }

    const stream = new ReadableStream({
        async start(controller) {
            const onParse = (event: ParsedEvent | ReconnectInterval) => {
                if (event.type === "event") {
                    const data = event.data;

                    if (data === "[DONE]") {
                        controller.close();
                        return;
                    }

                    try {
                        const json = JSON.parse(data);
                        const text = json.choices[0].delta.content;
                        const queue = encoder.encode(text);
                        controller.enqueue(queue);
                    } catch (e) {
                        controller.error(e);
                    }
                }
            };

            const parser = createParser(onParse);

            for await (const chunk of res.body as any) {
                parser.feed(decoder.decode(chunk));
            }
        }
    });

    return stream;
};
