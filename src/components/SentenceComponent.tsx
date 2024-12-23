import React, { useState, useEffect } from 'react';
import { Sentence, Claim } from './SentencesComponent.tsx';
import "../styles/SentencesComponent.css";

interface SentenceComponentProps {
    sentence: Sentence;
    i: number;
    onSentenceChange: (newSentence: Sentence, index: number) => void;
}

const SentenceComponent: React.FC<SentenceComponentProps> = ({ sentence, i, onSentenceChange }) => {
    const [claims, setClaims] = useState<Claim[]>(sentence.claims);
    const isLocal = true;
    const BACKEND_SERVER = isLocal ? "http://127.0.0.1:5000" : process.env.REACT_APP_BACKEND_SERVER;
    const [expanded, setExpanded] = useState<boolean>(false);
    const [isPromptDropdownOpen, setPromptDropdownOpen] = useState<Array<boolean>>(new Array(claims.length).fill(false));
    const [isSourceDropdownOpen, setSourceDropdownOpen] = useState<boolean>(false);
    const [userPrompt, setUserPrompt] = useState<string[]>(Array(claims.length).fill(""));
    const [promptOutputText, setPromptOutputText] = useState<string[]>(Array(claims.length).fill(""));
    const [loadingPrompt, setLoadingPrompt] = useState(false);
    const [fileInput, setFileInput] = useState(null); // Stores the uploaded PDF file
    const [textInput, setTextInput] = useState(""); // Stores plain text input
    const [errorMessage, setErrorMessage] = useState("");
    const [loadingSource, setLoadingSource] = useState(false);

    const updatePromptDropdownAtIndex = (index: number, value: boolean) => {
        setPromptDropdownOpen((prevDropdown) =>
            prevDropdown.map((dropdown, k) => (k === index ? value : dropdown))
        );
    };

    const updateUserPromptAtIndex = (index: number, value: string) => {
        setUserPrompt((prevPrompt) =>
            prevPrompt.map((prompt, k) => (k === index ? value : prompt))
        );
    };

    const updatepromptOutputTextAtIndex = (index: number, value: string) => {
        setPromptOutputText((prevOutput) =>
            prevOutput.map((output, k) => (k === index ? value : output))
        );
    };

    const getBackgroundColor = (type) => {
        if (type === 1) return 'lightgreen';
        if (type === 2) return 'lightcoral';
        return 'lightyellow';
    };

    const getExplanationInfo = (type) => {
        if (type === 1) return "Based only on the input text explain why the following claim is correct.";
        if (type === 2) return "Based only on the input text explain why the following claim is incorrect.";
        return "Based only on the input text explain why it is impossible to say whether following claim is correct or incorrect.";
    };

    const countInCorrect = (claims: Array<Claim>) => claims.filter((c) => c.type === 2).length;
    const countNotGiven = (claims: Array<Claim>) => claims.filter((c) => c.type === 3 || c.type === 4).length;

    const getMessage = (claims: Array<Claim>) => {
        let incorrectCnt = countInCorrect(claims);
        let cannotSayCnt = countNotGiven(claims);

        return <>
            {incorrectCnt > 0 && (
                <span style={{ color: 'darkred' }}>{incorrectCnt} errors detected</span>
            )}
            {incorrectCnt > 0 && cannotSayCnt > 0 && ', '}
            {cannotSayCnt > 0 && (
                <span style={{ color: 'orange' }}>
                    Could not check {cannotSayCnt} claims
                </span>
            )}
            {incorrectCnt === 0 && cannotSayCnt === 0 && (
                <span style={{ color: 'darkgreen' }}>No errors detected</span>
            )}
        </>
    };

    const getReferenceInfo = (type, references) => {
        if (type === 1)
            return <><p>Reference sentences:
                <span className="info-icon">i
                    <span className="tooltip">
                        Based only on the input text which specific setences from this text support the following claim? Output only enumerated sentences without any extra information.
                    </span>
                </span>
            </p><p>{references.toString()}</p></>
        if (type === 2)
            return <><p>Reference sentences:
                <span className="info-icon">i
                    <span className="tooltip">
                        Based only on the input text which specific setences from this text contradict the following claim? Output only enumerated sentences without any extra information.
                    </span>
                </span>
            </p><p>{references.toString()}</p></>
        return <></>;
    };

    const handlePromptSubmit = async (claim, j) => {
        if (!userPrompt[j].trim()) return;
        setLoadingPrompt(true);
        try {
            let body = JSON.stringify({
                prompt: userPrompt[j],
                claim: claim,
                sources: sentence.sources,
            });

            const response = await fetch(`${BACKEND_SERVER}/prompt`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: body
            });
            const data = await response.json();
            updatepromptOutputTextAtIndex(j, data.output || 'No response received.');
        } catch (error) {
            console.error('Error submitting prompt:', error);
            updatepromptOutputTextAtIndex(j, 'An error occurred while processing your request.');
        } finally {
            setLoadingPrompt(false);
        }
    };

    const handleFileInput = (e) => {
        const file = e.target.files[0];
        setFileInput(file);
        setTextInput("");
        setErrorMessage("");
    };

    const handleTextInput = (e) => {
        setTextInput(e.target.value);
        setFileInput(null);
        const fileInputElement = document.getElementById("fileUpload") as HTMLInputElement;
        fileInputElement.value = "";
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

    const handleSourceSubmit = async () => {
        if (!fileInput && !textInput) {
            setErrorMessage("Please upload a PDF or provide text for Input 1 and fill Input 2.");
            return;
        }
        setLoadingSource(true);
        let prevClaims = claims;
        setClaims([]);

        try {
            let body = JSON.stringify({
                claims: prevClaims,
                sources: sentence.sources,
                file: fileInput,
                textInput: textInput
            });

            const response = await fetch(`${BACKEND_SERVER}/add_source`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: body
            });
            const data = await response.json();
            setClaims(data.claims);
            sentence.claims = data.claims;
            onSentenceChange(sentence, i);
        } catch (error) {
            console.error("Error processing inputs:", error);
        } finally {
            setLoadingSource(false);
        }
    };

    return (
        <div className='claim-section' key={`sentence-${i}`}>
            <div
                className="claim-header"
                onClick={() => setExpanded(!expanded)}
                style={{ cursor: 'pointer', display: 'flex', alignItems: 'center' }}
            >
                <p>{sentence.sentence}</p>
                <div style={{ alignContent: 'right' }}>{getMessage(claims)}</div>
                <span className={`dropdown-arrow${expanded ? '.open' : ''}`}>
                    ▼
                </span>
            </div>
            {expanded && (
                <div className="claim-details">
                    <div>The sentence can be split into the following claims:</div>
                    {claims.map((claim, j) => (
                        <div className="output-section" style={{ backgroundColor: getBackgroundColor(claim.type) }} key={`claim-${i}-${j}`}>
                            <p>{claim.claim}</p>
                            <p>{claim.answer}
                                {claim.type !== 4 &&
                                    <span className="info-icon">i
                                        <span className="tooltip">
                                            Based only on the input text say whether the following claim is true or false? Reply with 'Correct', 'Incorrect', or 'Cannot Say'.
                                        </span>
                                    </span>
                                }
                            </p>
                            <p>Explanation:
                                {claim.type !== 4 &&
                                    <span className="info-icon">i
                                        <span className="tooltip">
                                            {getExplanationInfo(claim.type)}
                                        </span>
                                    </span>}{claim.explanation}
                            </p>
                            {getReferenceInfo(claim.type, claim.references)}

                            <div className="dropdown">
                                <button
                                    className="dropdown-toggle"
                                    onClick={() => updatePromptDropdownAtIndex(j, !isPromptDropdownOpen[j])}
                                >
                                    Try another prompt
                                </button>
                                {isPromptDropdownOpen[j] && (
                                    <div className="dropdown-content">
                                        <textarea
                                            placeholder="Enter your prompt here..."
                                            value={userPrompt[j]}
                                            onChange={(e) => updateUserPromptAtIndex(j, e.target.value)}
                                        />
                                        <button onClick={() => handlePromptSubmit(claim, j)} disabled={loadingPrompt}>
                                            {loadingPrompt ? 'Submitting...' : 'Submit'}
                                        </button>
                                        {promptOutputText[j] && (
                                            <div className="output-text">
                                                <strong>Output:</strong> {promptOutputText[j]}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                    <div className="dropdown">
                        <button
                            className="dropdown-toggle"
                            onClick={() => setSourceDropdownOpen(!isSourceDropdownOpen)}
                        >
                            Add another source
                        </button>
                        {isSourceDropdownOpen && (
                            <div className="dropdown-content">
                                <label htmlFor="fileUpload" className="input-label">
                                    Add New Source (File or Text):
                                </label>
                                <input
                                    type="file"
                                    accept=".pdf"
                                    id={`fileUpload-${i}`}
                                    onChange={handleFileInput}
                                />
                                <textarea
                                    placeholder="Or enter link or plain text"
                                    value={textInput}
                                    onChange={handleAdjustHeight}
                                    onInput={handleTextInput}
                                    rows={4}
                                />
                                <button onClick={handleSourceSubmit} className="submit-button">
                                    Submit
                                </button>
                                {loadingSource && <div>Loading...</div>}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    )
}

export default SentenceComponent;