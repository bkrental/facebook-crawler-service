import OpenAI from "openai";
import config from "./config.js";
import { getParameterValue } from "./ssm.js";

export const extractPostInfo = async (post) => {
    const openai = new OpenAI({
        apiKey: await getParameterValue(
            "OPENAI_API_KEY",
            config.OPENAI_API_KEY
        ),
    });

    const messages = [
        {
            role: "system",
            content:
                "You will be provided with unstructured data about the list of home renting posts, seperated by the endline, and your task is to get the information about the price, address and contact to parse in json format.",
        },
        {
            role: "user",
            content: post,
        },
    ];

    const chatCompletion = await openai.chat.completions.create({
        messages: messages,
        model: "gpt-3.5-turbo",
        temperature: 0,
    });

    return chatCompletion.choices[0].message.content;
};
