import React, { useState, useEffect } from 'react';
import { Sentence, Claim } from './SentencesComponent.tsx';
import "../styles/SentencesComponent.css";

interface SentenceComponentProps {
    sentence: Sentence;
    i: number;
    sources: Array<string>
}

const SentenceComponent: React.FC<SentenceComponentProps> = ({ sentence, i , sources}) => {
    const isLocal = true;
    const BACKEND_SERVER = isLocal ? "http://127.0.0.1:5000" : process.env.REACT_APP_BACKEND_SERVER;
    const [expanded, setExpanded] = useState<boolean>(false);
    const [isDropdownOpen, setDropdownOpen] = useState<Array<boolean>>(new Array(sentence.claims.length).fill(false));
    const [userPrompt, setUserPrompt] = useState<string[]>(Array(sentence.claims.length).fill(""));
    const [outputText, setOutputText] = useState<string[]>(Array(sentence.claims.length).fill(""));
    const [loading, setLoading] = useState(false);

    const updateDropdownAtIndex = (index: number, value: boolean) => {
        setDropdownOpen((prevDropdown) =>
            prevDropdown.map((dropdown, k) => (k === index ? value : dropdown))
        );
    };

    const updateUserPromptAtIndex = (index: number, value: string) => {
        setUserPrompt((prevPrompt) =>
            prevPrompt.map((prompt, k) => (k === index ? value : prompt))
        );
    };

    const updateOutputTextAtIndex = (index: number, value: string) => {
        setOutputText((prevOutput) =>
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
        setLoading(true);
        try {
            let body = JSON.stringify({
                prompt: userPrompt[j],
                claim: claim,
                sources: sources,
            });

            const response = await fetch(`${BACKEND_SERVER}/prompt`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: body
            });
            const data = await response.json();
            updateOutputTextAtIndex(j, data.output || 'No response received.');
        } catch (error) {
            console.error('Error submitting prompt:', error);
            updateOutputTextAtIndex(j, 'An error occurred while processing your request.');
        } finally {
            setLoading(false);
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
                <div style={{ alignContent: 'right' }}>{getMessage(sentence.claims)}</div>
                <span className={`dropdown-arrow${expanded ? '.open' : ''}`}>
                    ▼
                </span>
            </div>
            {expanded && (
                <div className="claim-details">
                    <div>The sentence can be split into the following claims:</div>
                    {sentence.claims.map((claim, j) => (
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
                                    onClick={() => updateDropdownAtIndex(j, !isDropdownOpen[j])}
                                >
                                    Try another prompt
                                </button>
                                {isDropdownOpen[j] && (
                                    <div className="dropdown-content">
                                        <textarea
                                            placeholder="Enter your prompt here..."
                                            value={userPrompt[j]}
                                            onChange={(e) => updateUserPromptAtIndex(j, e.target.value)}
                                        />
                                        <button onClick={() => handlePromptSubmit(claim, j)} disabled={loading}>
                                            {loading ? 'Submitting...' : 'Submit'}
                                        </button>
                                        {outputText[j] && (
                                            <div className="output-text">
                                                <strong>Output:</strong> {outputText[j]}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}

export default SentenceComponent;