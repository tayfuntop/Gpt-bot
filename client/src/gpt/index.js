import React, { useEffect, useState, useRef } from 'react';
import io from 'socket.io-client';
import speech from 'speech-js';
import SpeechRecognition, { useSpeechRecognition } from 'react-speech-recognition';

import { BsFillMicFill, BsSend, BsArrowDownCircleFill } from 'react-icons/bs';
import { Input } from 'antd';

import Logo from '../assets/logo.png';

const socket = io.connect("http://localhost:5000");

const Gpt = () => {

  const d = new Date();
  const [height, setHeight] = useState(window.innerHeight);
  const [text, setText] = useState("");
  const [chat, setChat] = useState(JSON.parse(localStorage.getItem("chat")) === null ? [] : JSON.parse(localStorage.getItem("chat")));
  const [loading, setLoading] = useState(false);
  const [isWrite, setIsWrite] = useState(false);
  const [animationLoading, setAnimationLoading] = useState(true);
  const [showScrollToButton, setShowScrollToButton] = useState(false);
  const {
    transcript,
    listening,
    resetTranscript,
    browserSupportsSpeechRecognition
  } = useSpeechRecognition();

  const messagesEndRef = useRef(null)
  const buttonRef = useRef(null);
  const dataRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  };

  const handleChatBoxScroll = () => {
    const { scrollTop, scrollHeight, clientHeight } = buttonRef.current;
    if (scrollHeight * 0.9 < scrollTop + clientHeight) {
      setShowScrollToButton(false);
    } else {
      setShowScrollToButton(true);
    };
  };

  useEffect(() => {
    socket.on("newMessage", async (data) => {
      setLoading(false);
      dataRef.current[dataRef.current.length - 1] = await {
        ...dataRef.current[dataRef.current.length - 1],
        user: "assistant", text: data.content === undefined ? dataRef.current[dataRef?.current.length - 1].text :
          (dataRef.current[dataRef?.current.length - 1].text + data.content)
      };
      setChat([...dataRef.current]);
      (data.content === undefined && dataRef.current[dataRef.current.length - 1] !== "") ? setIsWrite(false) : setIsWrite(true);
    })
    setAnimationLoading(false);
    const handleResize = () => {
      setHeight(window.innerHeight);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
    };

  }, []);

  useEffect(() => {
    scrollToBottom()
  }, [animationLoading]);

  useEffect(() => {
    setText(transcript)
  }, [transcript]);

  useEffect(() => {
    scrollToBottom()
    localStorage.setItem('chat', JSON.stringify(chat));
    dataRef.current = [...chat];
  }, [chat]);

  const sendText = async (event) => {
    event.preventDefault();
    resetTranscript();
    if (text.trim().length < 5) return;
    setChat(prevChat => [...prevChat, {
      id: prevChat.length + 1,
      text: text,
      user: "user",
      time: d.toLocaleTimeString().slice(0, 5)
    }, {
      id: prevChat.length + 2,
      text: "",
      user: "assistant",
      time: d.toLocaleTimeString().slice(0, 5)
    }]);
    socket.emit("newMessage", {
      chat: chat,
      text: text,
      date: d.toLocaleDateString() + " " + d.toLocaleTimeString(),
    })
    setLoading(true);
    setText("");
    setIsWrite(true);
  };

  const microphoneFunc = () => {
    if (listening) {
      SpeechRecognition.stopListening();
    } else {
      SpeechRecognition.startListening();
    };
  };

  if (!browserSupportsSpeechRecognition) {
    return <span>Browser doesn't support speech recognition.</span>;
  };

  const recognition = speech.recognition('TR')
  recognition.onresult = e => {
    let result = e.results[0][0].transcript
    speech.synthesis(result, 'TR')
  };

  const onChangeFunc = (e) => {
    setText(e.target.value);
    e.target.style.height = "auto";
    e.target.style.height = `${e.target.scrollHeight}px`
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && e.altKey) {
      e.preventDefault();
      setText(e.target.value + "\n");
    } else if (e.key === 'Enter') {
      e.preventDefault();
      sendText(e);
    };
  };

  return (
    <div style={{ height: height }} className={`bg-slate-800 flex justify-center perspective overflow-hidden`}>
      <div className={`bg-neutral-200 relative w-full m-4 md:mx-24 lg:mx-44 xl:mx-60 flex flex-col justify-between rounded-3xl 
          ${animationLoading ? "my-rotate-y-270" : "my-rotate-y-360"} preserve-3d backface-hidden`}>
        <div className='flex justify-between py-4 px-6 shadow-sm shadow-slate-300 rounded-t-3xl'>
          <span className='w-9'></span>
          <div className='flex flex-col items-center'>
            <span className='font-bold'>GPT BOT</span>
            <span className='text-black text-opacity-50 text-xs -mt-1'>{loading ? "Düşünüyor.." : "Çevrimiçi"}</span>
          </div>
          <div className='hover:scale-125 transition-transform '>
            <a target={'_blank'} href="https://www.instagram.com/tayfun_tp">
              <img src={Logo} className='w-9' alt="" />
            </a>
          </div>
        </div>
        <div id='scroll-id' ref={buttonRef} onScroll={handleChatBoxScroll}
          className='h-full px-3 py-2 md:px-6 md:py-4 gap-4 overflow-y-auto overflow-x-hidden flex flex-col relative'>
          {chat &&
            chat.map((item, index) => {
              return (
                <div key={index} className={`flex items-center ${item.text === "" && "hidden"} ${item.user === "user" ? "ml-auto" : "mr-auto"} gap-2 text-slate-800`}>
                  <div className={`mr-auto rounded-xl pt-2 pb-1 px-3 lg:max-w-xl max-w-sm md:max-w-md sm:max-w-md
                      ${item.user === "user" ? "text-white bg-slate-800 ml-[36px]" : "text-slate-800 bg-white mr-[36px]"} flex flex-col`}>
                    <span className='break-words text-xs sm:text-sm'>
                      {
                        item.text && item.text.split("\n").map((item, index) => {
                          return <span key={index}>{item}<br /></span>
                        }
                        )
                      }
                    </span>
                    <span className={`text-[8px] sm:text-[10px] ml-auto -mb-[3px] mt-1 ${item.user === "user" ? "text-white" : "text-slate-800"} opacity-40`}>{item.time}</span>
                  </div>
                </div>
              )
            })
          }
          {
            loading && (
              <div className={`mr-auto rounded-xl py-2 px-3 lg:max-w-4xl max-w-xs md:max-w-lg text-slate-800 bg-white -mb-3 lg:-ml-1 lg:-mb-6 mt-auto`}>
                <span className='break-words text-xs sm:text-sm flex'>
                  <div className="loader-dots block relative w-16 h-3 mt-1">
                    <div className="absolute top-0 w-2 h-2 rounded-full bg-slate-600"></div>
                    <div className="absolute top-0 w-2 h-2 rounded-full bg-slate-600"></div>
                    <div className="absolute top-0 w-2 h-2 rounded-full bg-slate-600"></div>
                    <div className="absolute top-0 w-2 h-2 rounded-full bg-slate-600"></div>
                  </div>
                </span>
              </div>
            )
          }
          <div ref={messagesEndRef} />
        </div>
        <form onSubmit={sendText} className='py-2 px-3 flex justify-between items-center bg-neutral-100 rounded-b-3xl shadow-md shadow-slate-800'>
          <Input.TextArea

            autoSize={{ minRows: 2, maxRows: 6 }}
            onKeyDown={handleKeyDown}
            disabled={isWrite} onChange={(e) => onChangeFunc(e)} value={text} placeholder="Haydi sohbet edelim.."
            className='rounded-xl mr-4 md:ml-4 ml-1 overflow-hidden' />
          <div className='flex gap-2 md:gap-3 md:px-2'>
            <button type='reset' disabled={isWrite}
              onClick={() => microphoneFunc()} className={`w-10 h-10 ${!listening && "hover:scale-105"} ${listening && "animate-pulse scale-110"} bg-slate-800 cursor-pointer transition-transform rounded-full flex justify-center items-center`}>
              <BsFillMicFill className={`w-5 h-5 text-neutral-200  `} />
            </button>
            <button
              disabled={isWrite}
              type='submit' className='w-10 h-10 bg-slate-800 hover:scale-105 cursor-pointer group transition-transform rounded-full flex justify-center items-center'>
              <BsSend className='w-5 h-5 text-neutral-200 ' />
            </button>
          </div>
        </form>
        <div
          onClick={() => scrollToBottom()}
          className={`${!showScrollToButton && "hidden"} ${!animationLoading && "hidden"} absolute bottom-20 right-8 z-50 bg-neutral-200 transition-transform 
            cursor-pointer animate-bounce flex justify-center items-center rounded-full`}>
          <BsArrowDownCircleFill className='text-slate-800 w-12 h-12' />
        </div>
      </div>
    </div>
  );
};

export default Gpt;