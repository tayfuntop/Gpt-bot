const http = require('http');
const express = require('express');
const cors = require('cors');

const dotenv = require('dotenv');
const bodyParser = require('body-parser');

const { Server } = require('socket.io');
const { Configuration } = require('openai');
const { OpenAIApi } = require('openai');
const { env } = require('process');


dotenv.config();

const configuration = new Configuration({
    apiKey: "<YOUR-API-KEY>",  // You can get your API key from https://beta.openai.com/account/api-keys. 
});    // Env variable is also supported. For example OPENAI_API_KEY=sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx env.OPENAI_API_KEY

const openai = new OpenAIApi(configuration);

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "http://localhost:3000",
        methods: ["GET", "POST"],
    }
});

app.use(bodyParser.json({ limit: "30mb", extended: true }));
app.use(bodyParser.urlencoded({ limit: "30mb", extended: true }));
app.use(cors());

io.on('connection', (socket) => {
    console.log('a user connected');

    const userRoom = 'room-' + socket.id;
    socket.join(userRoom);

    socket.on('newMessage', async (message) => {
        
        const messagesData = await message.chat.length > 4 ? message.chat.slice(-3).map(message => {    // If the chat history is more than 4 messages, we only use the last 3 messages.
            return (
                {
                    "role": message.user,
                    "content": message.text,
                }
            )
        }) : message.chat.map(message => {
            return (
                {
                    "role": message.user,
                    "content": message.text,
                }
            )
        });
        await messagesData.unshift(
            { "role": "system", "content": "You are a helpful assistant." },
            { "role": "user", "content": "Who won the world series in 2020?" },
            { "role": "assistant", "content": "The Los Angeles Dodgers won the World Series in 2020." },
        )
        await messagesData.push(
            { "role": "user", "content": message.text },
        )

        const completion = await openai.createChatCompletion(
            {
                model: "gpt-3.5-turbo",
                messages: messagesData,
                stream: true,      // This is the important part. We want to stream the response. Then socket will emit the response to the client.
            },
            { responseType: "stream" },
        );

        completion.data.on("data", (data) => {
            const lines = data
                ?.toString()
                ?.split("\n")
                .filter((line) => line.trim() !== "");
            for (const line of lines) {
                const message = line.replace(/^data: /, "");
                if (message === "[DONE]") {
                    break; // Stream finished
                }
                try {
                    const parsed = JSON.parse(message);
                    io.timeout(200).to(userRoom).emit("newMessage", parsed.choices[0].delta);
                } catch (error) {
                    console.error("Could not JSON parse stream message", message, error);
                }
            }
        });

    });
});

server.listen(5000, () => {
    console.log(`Server running on port: 5000`);
});