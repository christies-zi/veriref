import React, { useState } from 'react';
import { Sentence, Claim } from './SentencesComponent.tsx';
import "../styles/SentencesComponent.css";
import axios from 'axios';

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
    const [fileInput, setFileInput] = useState(null);
    const [textInput, setTextInput] = useState("");
    const [loadingSource, setLoadingSource] = useState(false);
    const [reloading, setReloading] = useState(false);

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
    };

    const handleTextInput = (e) => {
        setTextInput(e.target.value);
        setFileInput(null);
        const fileInputElement = document.getElementById("fileUpload") as HTMLInputElement;
        fileInputElement.value = "";
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
            return;
        }
        setLoadingSource(true);
        let prevClaims = claims;
        setClaims([]);
        try {
            const formData = new FormData();
            if (fileInput) {
              formData.append("file", fileInput);
            } else if (textInput) {
              formData.append("textInput", textInput);
            }
            const response = await axios.post(`${BACKEND_SERVER}/add_source`, formData, {
              headers: {
                "Access-Control-Allow-Origin": `${BACKEND_SERVER}/add_source`,
                "Content-Type": "multipart/form-data",
              },
            });
            setClaims(response.data.claims);
            sentence.claims = response.data.claims;
            onSentenceChange(sentence, i);
        } catch (error) {
            console.error("Error processing inputs:", error);
        } finally {
            setLoadingSource(false);
        }
    };

    const handleReload = async () => {
        setReloading(true);
        setClaims([]);
        try {
            let body = JSON.stringify({
                sentence: sentence.sentence,
                sources: sentence.sources,
                claims: sentence.claims
            });

            const response = await fetch(`${BACKEND_SERVER}/analyse_sentence`, {
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
            setReloading(false);
        }
    };

    return (
        <div className='claim-section' key={`sentence-${i}`}>
            <div
                className="claim-header"
                onClick={() => setExpanded(!expanded)}
                style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}
            >
                <p>{sentence.sentence}</p>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
                    <div>{getMessage(claims)}</div>
                    <span className={`dropdown-arrow${expanded ? '.open' : ''}`}>
                        ▼
                    </span>
                </div>
            </div>
            {expanded && (
                <div className="claim-details">
                    <div className="section-title">The sentence can be split into the following claims:</div>
                    {claims.map((claim, j) => (
                        <div className="claim" style={{ backgroundColor: getBackgroundColor(claim.type) }} key={`claim-${i}-${j}`}>
                            <p className="claim-text">{claim.claim}</p>
                            <p className="claim-answer">
                                {claim.answer}
                                {claim.type !== 4 && (
                                    <span className="info-icon">
                                        i
                                        <span className="tooltip">
                                            Based only on the input text say whether the following claim is true or false? Reply with 'Correct', 'Incorrect', or 'Cannot Say'.
                                        </span>
                                    </span>
                                )}
                            </p>
                            <p className="claim-explanation">
                                Explanation:
                                {claim.type !== 4 && (
                                    <span className="info-icon">
                                        i
                                        <span className="tooltip">
                                            {getExplanationInfo(claim.type)}
                                        </span>
                                    </span>
                                )}
                                {claim.explanation}
                            </p>
                            {getReferenceInfo(claim.type, claim.references)}

                            <div className="dropdown">
                                <div
                                    className="claim-header"
                                    onClick={() => updatePromptDropdownAtIndex(j, !isPromptDropdownOpen[j])}
                                    style={{ cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                                >
                                    <p>Try another prompt</p>
                                    <span className={`dropdown-arrow${expanded ? '.open' : ''}`}>
                                        ▼
                                    </span>
                                </div>
                                {isPromptDropdownOpen[j] && (
                                    <div className="dropdown-content">
                                        <textarea
                                            placeholder="Enter your prompt here..."
                                            value={userPrompt[j]}
                                            onChange={(e) => updateUserPromptAtIndex(j, e.target.value)}
                                        />
                                        <button onClick={() => handlePromptSubmit(claim, j)} disabled={loadingPrompt} className="button">
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
                    <div className="claim">
                        <div className="dropdown">
                            <div
                                className="claim-header"
                                onClick={() => setSourceDropdownOpen(!isSourceDropdownOpen)}
                                style={{ cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                            >
                                <p>Add another source</p>
                                <span className={`dropdown-arrow${expanded ? '.open' : ''}`}>
                                    ▼
                                </span>
                            </div>
                            {isSourceDropdownOpen && (
                                <div className="dropdown-content">
                                    <label htmlFor="fileUpload" className="input-label" />
                                    <input
                                        type="file"
                                        accept=".pdf"
                                        id={`fileUpload-${i}`}
                                        onChange={handleFileInput}
                                        className="file-input"
                                    />
                                    <textarea
                                        placeholder="Or enter link or plain text"
                                        value={textInput}
                                        onChange={handleAdjustHeight}
                                        onInput={handleTextInput}
                                        rows={4}
                                        className="text-input"
                                    />
                                    <button onClick={handleSourceSubmit} className="button">
                                        Submit
                                    </button>
                                    {loadingSource && <div className="loading-spinner">Loading...</div>}
                                </div>
                            )}
                        </div>
                    </div>
                    <button onClick={handleReload} className="button-big">
                        Reload
                    </button>
                    {reloading && <div className="loading-spinner">Reloading...</div>}
                </div>)}

        </div>
    )
}

export default SentenceComponent;