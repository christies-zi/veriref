import React, { useState } from "react";
import axios from "axios";
import "./styles/App.css";

function App() {
  const isLocal = true;
  const BACKEND_SERVER = isLocal ? "http://127.0.0.1:5000" : process.env.REACT_APP_BACKEND_SERVER;
  const [sourceFileInput, setSourceFileInput] = useState(null); // Stores the uploaded PDF file
  const [sourceTextInput, setSourceTextInput] = useState(""); // Stores plain text input
  const [toVerify, setToVerify] = useState(""); // Second input
  const [shortAnswer, setShortAnswer] = useState("");
  const [explanation, setExplanation] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [claims, setClaims] = useState([]);
  const [claimsAnswers, setClaimsAnswers] = useState([]);
  const [claimsExplanations, setClaimsExplanations] = useState([]);
  const [claimsSentences, setClaimsSentences] = useState([]);

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    setSourceFileInput(file); // Save the uploaded file
    setSourceTextInput(""); // Clear text input (only one input type allowed)
    setErrorMessage("");
  };

  const handlesourceTextInput = (e) => {
    setSourceTextInput(e.target.value); // Save the plain text
    setSourceFileInput(null); // Clear file input (only one input type allowed)
    setErrorMessage("");
  };

  const handleToVerifyInput = (e) => {
    setToVerify(e.target.value); // Save the plain text // Clear file input (only one input type allowed)
    setErrorMessage("");
  };

  const handleSubmit = async () => {
    if ((!sourceFileInput && !sourceTextInput) || !toVerify.trim()) {
      setErrorMessage("Please upload a PDF or provide text for Input 1 and fill Input 2.");
      return;
    }

    setShortAnswer("");
    setExplanation("");
    setIsLoading(true);
    setClaims([]);
    setClaimsAnswers([]);
    setClaimsExplanations([]);
    setClaimsSentences([]);

    try {
      const formData = new FormData();
      if (sourceFileInput) {
        formData.append("file", sourceFileInput); // Include the uploaded file
      } else if (sourceTextInput) {
        formData.append("sourceTextInput", sourceTextInput); // Include the plain text
      }
      formData.append("toVerify", toVerify); // Include Information to be verified

      const response = await axios.post(`${BACKEND_SERVER}/process`, formData, {
        headers: {
          "Access-Control-Allow-Origin": BACKEND_SERVER,
          "Content-Type": "multipart/form-data",
        },
      });

      setShortAnswer(response.data.shortAnswer);
      setExplanation(response.data.explanation);
      console.log(response.data.claims);
      let claimsLoc = [];
      let answers = [];
      let explanations = [];
      let sentences = [];
      response.data.claims.forEach(function(element) {
        claimsLoc.push(element[0]);
        answers.push(element[1]);
        explanations.push(element[2]);
        sentences.push(element[3]);
      });

      setClaims(claimsLoc);
      setClaimsAnswers(answers);
      setClaimsExplanations(explanations);
      setClaimsSentences(sentences);
    } catch (error) {
      console.error("Error processing inputs:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="app-container">
      <h1>Veriref</h1>

      <div className="input-group">
          <label htmlFor="toVerify" className="input-label">
            Information to Verify (Text):
          </label>
          <textarea
            placeholder="Enter information to be verified"
            value={toVerify}
            onChange={handleToVerifyInput}
            className="input-textarea"
            rows="4"
          />
        </div>

      <div className="input-section">
        <div className="input-group">
          <label htmlFor="fileUpload" className="input-label">
            Source/Reference (Upload PDF or Enter URL or Text):
          </label>
          <input
            type="file"
            accept=".pdf"
            id="fileUpload"
            onChange={handleFileUpload}
            className="input-file"
          />
          <textarea
            placeholder="Or enter plain text or URL her"
            value={sourceTextInput}
            onChange={handlesourceTextInput}
            className="input-textarea"
            rows="4"
          />
        </div>
      </div>

      {errorMessage && <p className="error-message">{errorMessage}</p>}

      <button onClick={handleSubmit} className="submit-button">
        Submit
      </button>

      {isLoading && <div className="loading-spinner">Loading...</div>}

      {shortAnswer && (
        <div className="output-section">
          <h3>The input information can be split into the following claims:</h3>
        </div>
      )}

      {claims.map((claim, i) => (
          <div className="output-section">
            <h3>{claim}</h3>
            <div>{claimsAnswers[i]}</div>
            <p>Explanation: {claimsExplanations[i]}</p>
            <p>Reference sentences:</p>
            <p>{claimsSentences[i].toString()}</p>
          </div>
          ))}


    </div>
  );
}

export default App;
