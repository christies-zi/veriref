import React, { useState } from "react";
import axios from "axios";
import "./styles/App.css";
import "./components/SentencesComponent"
import SentencesComponent, { Claim, Sentence } from "./components/SentencesComponent";
import GradientText from "./components/GradientText";

function App() {
  const isLocal = true;
  const BACKEND_SERVER = isLocal ? "http://127.0.0.1:5000" : process.env.REACT_APP_BACKEND_SERVER;
  const [fileInput, setFileInput] = useState(null); // Stores the uploaded PDF file
  const [textInput, setTextInput] = useState(""); // Stores plain text input
  const [errorMessage, setErrorMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [sentences, setSentences] = useState<Sentence[]>([]);

  const handleFileInput = (e) => {
    const file = e.target.files[0];
    setFileInput(file); // Save the uploaded file
    setTextInput(""); // Clear text input (only one input type allowed)
    setErrorMessage("");
  };

  const handleTextInput = (e) => {
    setTextInput(e.target.value);
    setFileInput(null);
    const fileInputElement = document.getElementById("fileUpload") as HTMLInputElement;
    fileInputElement.value = ""; // Clear the input field
    setErrorMessage("");
  };

  const handleAdjustHeight = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const textarea = e.target;
    textarea.style.height = "auto";
    const maxRows = 50;
    const lineHeight = 24;
    const maxHeight = lineHeight * maxRows;
    textarea.style.height = `${Math.min(textarea.scrollHeight, maxHeight)}px`;
  };

  const handleSubmit = async () => {
    if (!fileInput && !textInput) {
      setErrorMessage("Please upload a PDF or provide text for Input 1 and fill Input 2.");
      return;
    }
    setIsLoading(true);
    setSentences([]);

    try {
      const formData = new FormData();
      if (fileInput) {
        formData.append("file", fileInput);
      } else if (textInput) {
        formData.append("textInput", textInput);
      }

      const response = await axios.post(`${BACKEND_SERVER}/process`, formData, {
        headers: {
          "Access-Control-Allow-Origin": `${BACKEND_SERVER}/process`,
          "Content-Type": "multipart/form-data",
        },
      });
      if (response.data.jobId) {
        const eventSource = new EventSource(`${BACKEND_SERVER}/launch_processing_job/${response.data.jobId}`);

          eventSource.onmessage = (event) => {
            let msg = JSON.parse(event.data);
            console.log(msg);
          
            if (msg.messageType === "end") {
              eventSource.close();
            } else if (msg.messageType === "sentences") {
              setSentences(msg.sentences);
            } else if (msg.messageType === "claims") {
              // Use `setSentences` with an updated version of the sentences array
              setSentences((prevSentences) =>
                prevSentences.map((sentence, k) =>
                  k === msg.sentenceIndex ? { ...sentence, claims: msg.claims } : sentence
                )
              );
            } else if (msg.messageType === "claim") {
              // Handle other cases
            } else if (msg.messageType === "claimNoResource") {
              // Handle other cases
            }
          };
          
      }

    } catch (error) {
      console.error("Error processing inputs:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="app-container">
      <h1>Veriref</h1>

      <div className="input-section">
        <div className="input-group">
          <label htmlFor="fileUpload" className="input-label">
            Information to be Verified (Upload PDF or Enter Text):
          </label>
          <input
            type="file"
            accept=".pdf"
            id="fileUpload"
            onChange={handleFileInput}
            className="input-file"
          />
          <textarea
            placeholder="Or enter plain text"
            value={textInput}
            onChange={handleAdjustHeight}
            onInput={handleTextInput}
            className="input-textarea"
            rows={4}
          />
        </div>
      </div>

      {errorMessage && <p className="error-message">{errorMessage}</p>}

      <button onClick={handleSubmit} className="submit-button">
        Submit
      </button>

      {isLoading &&
        <div style={{ textAlign: "center", marginTop: "50px" }}>
          <GradientText text="Loading" />
        </div>}

      {sentences.length !== 0 && <h3>Detailed sentence by sentence analysis:</h3>}

      {<SentencesComponent inputSentences={sentences} />}

    </div>
  );
}

export default App;
