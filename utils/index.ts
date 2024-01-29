import {Message, OpenAIModel} from "@/types";
import {createParser, ParsedEvent, ReconnectInterval} from "eventsource-parser";
import {seatbeltPolicy} from "@/utils/data/seatbelt-policy";
import {useOfForce} from "@/utils/data/use-of-force";
import {grooming} from "@/utils/data/grooming";
import {bodyCameras} from "@/utils/data/body-cameras";

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
                    content: `
                    You are very friendly chatbot who talks to anxious San Francisco citizens about the police who want to ask questions
                    about the SFPD's policy. You will need to select one of the policies below to provide the content in your answer.
                    The first part of your answer must contain the name of the official SF policy and a URL to the policy. This must come FIRST.
                    You will then proceed to summarize the part of that policy that is relevant to their question, using only information from the linked policy. Be succinct, but quote directly from the policy
                    when possible to make it clearly official.

                    If there's a relevant policy, but there's no direct answer to the question, then be up front about that.
                    Do not make up answers. Do not use markdown. I will tip extra for accurate information.

                    Policies:

                    Title: Use of Force Policy And Proper Control Of A Person
                    URL: https://www.sanfranciscopolice.org/sites/default/files/2023-12/SFPDDGO_5_01_20231205.pdf
                    Text: ${useOfForce}

                    Title: Grooming Standards
                    URL: https://www.sanfranciscopolice.org/sites/default/files/2023-08/SFPDDGO_11_08_20230828.pdf
                    Text: ${grooming}s

                    Title: Seatbelt Policy
                    URL https://www.sanfranciscopolice.org/sites/default/files/2018-11/DGO9.04%20Seat%20Belt%20Policy.pdf
                    Text: ${seatbeltPolicy}

                    Title: Body Cameras
                    URL: https://www.sanfranciscopolice.org/sites/default/files/2020-11/DGO10.11.BWC_.20201110.pdf
                    Text: ${bodyCameras}
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
