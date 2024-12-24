import React, { useState } from "react";
import axios from "axios";
import "./styles/App.css";
import "./components/SentencesComponent"
import SentencesComponent, { Sentence } from "./components/SentencesComponent";

function App() {
  const isLocal = false;
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
    setTextInput(e.target.value); // Save the plain text
    setFileInput(null); // Clear file input (only one input type allowed)
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
      setSentences(response.data.sentences);

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

      {isLoading && <div className="loading-spinner">Loading...</div>}

      {sentences.length !== 0 && <h3>Detailed sentence by sentence analysis:</h3>}

      {<SentencesComponent inputSentences={sentences} />}

    </div>
  );
}

export default App;
