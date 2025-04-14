import React, { useEffect, useState } from 'react';
import { Sentence, Claim } from './SentencesComponent.tsx';
import "../styles/SentencesComponent.css";
import axios from 'axios';
import GradientText from './GradientText.tsx';
import Typewriter from './Typewriter.tsx';
import { motion, AnimatePresence } from "framer-motion";

interface SentenceComponentProps {
    sentenceExt: Sentence;
    i: number;
    onSentenceChange: (newSentence: Sentence, index: number) => void;
    typesToAnalyse: number[];
    processingText: string;
    processingTextState: number;
}

type ExtendedClaim = Claim & { index: number, fadingOut: boolean };

const SentenceComponent: React.FC<SentenceComponentProps> = ({ sentenceExt, i, onSentenceChange, typesToAnalyse, processingText, processingTextState }) => {
    const [sentence, setSentence] = useState<Sentence>(sentenceExt);
    const [claims, setClaims] = useState<Claim[]>(sentence.claims);
    const isLocal = false;
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
    const [sortedClaims, setSortedClaims] = useState<ExtendedClaim[]>(sentence.claims.map((c, i) => ({ ...c, index: i, fadingOut: false })));
    const [filteredsIndices, setFilteredIndices] = useState<number[]>([])
    const [receivedAllClaims, setReceivedAllClaims] = useState<boolean>(false);


    useEffect(() => {
        const filtered = [...claims].map((c, i) => ({ ...c, index: i, fadingOut: false })).filter((c) => filteredsIndices.includes(c.index))
        const sorted = [...filtered].sort((a, b) => {
            const order = { 2: 1, 3: 2, 4: 3, 1: 4, 5: 5 };
            return (order[a.type] || 6) - (order[b.type] || 6);
        });

        const filteredClaims: ExtendedClaim[] = [];
        const disappearingClaims: ExtendedClaim[] = [];

        const newFiltered: number[] = [];

        sorted.forEach((claim) => {
            if (typesToAnalyse.includes(claim.type)) {
                filteredClaims.push(claim);
                newFiltered.push(claim.index);
            } else {
                disappearingClaims.push(claim);
            }
        });

        setFilteredIndices(newFiltered);

        const res = filteredClaims.concat(disappearingClaims)
        setSortedClaims(res)

        // Set a timeout to remove non-analyzed claims after 1.5 second
        const timeouts = disappearingClaims.map((claim) =>
            setTimeout(() => {
                setSortedClaims((prev) => prev.map((c) => c === claim ? { ...c, fadingOut: true } : c));

                setTimeout(() => {
                    setSortedClaims((prev) => prev.filter((c) => c !== claim));
                }, 200);
            }, 1000)
        );

        return () => timeouts.forEach(clearTimeout);
    }, [claims, receivedAllClaims]);

    useEffect(() => {
        setClaims(sentenceExt.claims);
        if (!receivedAllClaims && sentenceExt.claims.length > 0) {
            setReceivedAllClaims(true);
            setFilteredIndices(sentenceExt.claims.map((_, i) => i));
        }
    }, [sentence, sentenceExt, i]);

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

    const getExplanationInfo = (type) => {
        if (type === 1) return "Based only on the input text explain why the following claim is correct.";
        if (type === 2) return "Based only on the input text explain why the following claim is incorrect.";
        return "Based only on the input text explain why it is impossible to say whether following claim is correct or incorrect.";
    };

    const countInCorrect = (claims: Array<Claim>) => claims.filter((c) => c.type === 2).length;
    const countNotGiven = (claims: Array<Claim>) => claims.filter((c) => c.type === 3 || c.type === 4).length;

    const getMessage = (claims: Array<Claim>) => {
        if (processingTextState === 0) {
            return <p>{processingText}</p>
        }
        if (claims.length === 0 || claims.some((c) => c.type === 5)) {
            return <><GradientText text={'Processing'} state={5} /></>
        }
        let incorrectCnt = countInCorrect(claims);
        let cannotSayCnt = countNotGiven(claims);

        return <>
            {incorrectCnt > 0 && (
                <span style={{ color: 'darkred' }}>{incorrectCnt} wrong claim in the input text detected</span>
            )}
            {incorrectCnt > 0 && cannotSayCnt > 0 && ', '}
            {cannotSayCnt > 0 && (
                <span style={{ color: 'orange' }}>
                    Could not check {cannotSayCnt} claims
                </span>
            )}
            {incorrectCnt === 0 && cannotSayCnt === 0 && (
                <span style={{ color: 'darkgreen' }}>No errors in the input text detected</span>
            )}
        </>
    };

    const getReferenceInfo = (type, references, processingText) => {
        if (type === 1)
            return <><p>Reference sentences:
                <span className="info-icon">i
                    <span className="tooltip">
                        Based only on the input text which specific setences from this text support the following claim? Output only enumerated sentences without any extra information.
                    </span>
                </span>
                {!references && <GradientText text={processingText} state={5} />}
                {references && <Typewriter text={references.toString()} />}
            </p></>
        if (type === 2)
            return <><p>Reference sentences:
                <span className="info-icon">i
                    <span className="tooltip">
                        Based only on the input text which specific setences from this text contradict the following claim? Output only enumerated sentences without any extra information.
                    </span>
                </span>
                {!references && <GradientText text={processingText} state={5} />}=
                {references && <Typewriter text={references.toString()} />}
            </p></>
        return <></>;
    };

    const getBackgroudColour = (claimType: number | undefined | null) => {
        if (claimType === 1) return 'darkgreen'
        if (claimType === 2) return 'darkred'
        if (claimType === 5) return 'grey'
        return 'orange'
    }

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
        const fileInputElement = document.getElementById(`fileUpload-${i}`) as HTMLInputElement;
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
        setReceivedAllClaims(false);

        try {
            const formData = new FormData();
            if (fileInput) {
                formData.append("file", fileInput);
            } else if (textInput) {
                formData.append("textInput", textInput);
            }
            formData.append("claims", JSON.stringify(prevClaims));
            formData.append("sources", JSON.stringify(sentence.sources));
            formData.append("sentence", JSON.stringify(sentence.sentence));
            formData.append("sentenceIndex", JSON.stringify(i));

            const response = await axios.post(`${BACKEND_SERVER}/add_source`, formData, {
                headers: {
                    "Access-Control-Allow-Origin": `${BACKEND_SERVER}/add_source`,
                    "Content-Type": "multipart/form-data",
                },
            });
            if (response.data.jobId) {
                const eventSource = new EventSource(`${BACKEND_SERVER}/launch_source_job/${response.data.jobId}`);

                eventSource.onmessage = (event) => {
                    let msg = JSON.parse(event.data);

                    if (msg.messageType === "end") {
                        eventSource.close();
                    } else if (msg.messageType === "claims") {
                        setFilteredIndices(msg.claims.map((_, i) => i));
                        setReceivedAllClaims(true);
                        setClaims(msg.claims);
                        setSentence(prev => {
                            const newSentence = { ...prev, claims: [...msg.claims] };
                            onSentenceChange(newSentence, i);
                            return newSentence;
                        });
                    } else if (msg.messageType === "claimAnswer") {
                        setClaims((prevClaims) =>
                            prevClaims.map((claim, idx) =>
                                idx === msg.claimIndex ? msg.claim : claim
                            )
                        )
                        setSentence(prev => {
                            const newSentence = {
                                ...prev,
                                claims: prev.claims.map((claim, idx) =>
                                    idx === msg.claimIndex ? msg.claim : claim
                                )
                            };
                            onSentenceChange(newSentence, i);
                            return newSentence;
                        });
                    } else if (msg.messageType === "claimExplanation") {
                        setClaims((prevClaims) =>
                            prevClaims.map((claim, idx) =>
                                idx === msg.claimIndex ? msg.claim : claim
                            )
                        )
                        setSentence(prev => {
                            const newSentence = {
                                ...prev,
                                claims: prev.claims.map((claim, idx) =>
                                    idx === msg.claimIndex ? msg.claim : claim
                                )
                            };
                            onSentenceChange(newSentence, i);
                            return newSentence;
                        });
                    } else if (msg.messageType === "claimReferences") {
                        setClaims((prevClaims) =>
                            prevClaims.map((claim, idx) =>
                                idx === msg.claimIndex ? msg.claim : claim
                            )
                        )
                        setSentence(prev => {
                            const newSentence = {
                                ...prev,
                                claims: prev.claims.map((claim, idx) =>
                                    idx === msg.claimIndex ? msg.claim : claim
                                )
                            };
                            onSentenceChange(newSentence, i);
                            return newSentence;
                        });
                    }
                }
            }
        } catch (error) {
            console.error("Error processing inputs:", error);
            setClaims(prevClaims);
        } finally {
            setLoadingSource(false);
        }

    };

    const handleReload = async () => {
        setLoadingSource(true);
        let prevClaims = claims;
        setClaims([]);
        setReceivedAllClaims(false);

        try {
            const formData = new FormData();
            formData.append("sources", JSON.stringify(sentence.sources));
            formData.append("sentence", JSON.stringify(sentence.sentence));
            formData.append("sentenceIndex", JSON.stringify(i));

            const response = await axios.post(`${BACKEND_SERVER}/analyse_sentence`, formData, {
                headers: {
                    "Access-Control-Allow-Origin": `${BACKEND_SERVER}/analyse_sentence`,
                    "Content-Type": "multipart/form-data",
                },
            });

            if (response.data.jobId) {
                const eventSource = new EventSource(`${BACKEND_SERVER}/launch_sentence_job/${response.data.jobId}`);

                eventSource.onmessage = (event) => {
                    let msg = JSON.parse(event.data);

                    if (msg.messageType === "end") {
                        eventSource.close();
                    } else if (msg.messageType === "claims") {
                        setFilteredIndices(msg.claims.map((_, i) => i));
                        setReceivedAllClaims(true);
                        setClaims(msg.claims);
                        setSentence(prev => {
                            const newSentence = { ...prev, claims: [...msg.claims] };
                            onSentenceChange(newSentence, i);
                            return newSentence;
                        });
                    } else if (msg.messageType === "claimAnswer") {
                        setClaims((prevClaims) =>
                            prevClaims.map((claim, idx) =>
                                idx === msg.claimIndex ? msg.claim : claim
                            )
                        )
                        setSentence(prev => {
                            const newSentence = {
                                ...prev,
                                claims: prev.claims.map((claim, idx) =>
                                    idx === msg.claimIndex ? msg.claim : claim
                                )
                            };
                            onSentenceChange(newSentence, i);
                            return newSentence;
                        });
                    } else if (msg.messageType === "claimExplanation") {
                        setClaims((prevClaims) =>
                            prevClaims.map((claim, idx) =>
                                idx === msg.claimIndex ? msg.claim : claim
                            )
                        )
                        setSentence(prev => {
                            const newSentence = {
                                ...prev,
                                claims: prev.claims.map((claim, idx) =>
                                    idx === msg.claimIndex ? msg.claim : claim
                                )
                            };
                            onSentenceChange(newSentence, i);
                            return newSentence;
                        });
                    } else if (msg.messageType === "claimReferences") {
                        setClaims((prevClaims) =>
                            prevClaims.map((claim, idx) =>
                                idx === msg.claimIndex ? msg.claim : claim
                            )
                        )
                        setSentence(prev => {
                            const newSentence = {
                                ...prev,
                                claims: prev.claims.map((claim, idx) =>
                                    idx === msg.claimIndex ? msg.claim : claim
                                )
                            };
                            onSentenceChange(newSentence, i);
                            return newSentence;
                        });
                    } else if (msg.messageType === "claimNoResource") {
                        setClaims([msg.claim]);
                        setSentence(prev => {
                            const newSentence = { ...prev, claims: [...[msg.claim]] };
                            onSentenceChange(newSentence, i);
                            return newSentence;
                        });
                    }
                }
            }
        } catch (error) {
            console.error("Error processing inputs:", error);
            setClaims(prevClaims);
        } finally {
            setLoadingSource(false);
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
                    {claims.length === 0 && <div><GradientText text={processingText} state={processingTextState} /></div>}
                    {claims.length !== 0 &&
                        <>
                            <div className="section-title">The sentence can be split into the following claims:</div>
                            <AnimatePresence>
                                <motion.div layout>
                                    {sortedClaims.map((claim, j) => (
                                        <motion.div
                                            key={claim.claim}
                                            layout
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: claim.fadingOut ? 0 : 1, y: claim.fadingOut ? -10 : 0 }}
                                            exit={{ opacity: 0, y: -10 }}
                                            transition={{ type: "spring", stiffness: 100, damping: 15 }}
                                            className="claim-item"
                                        >
                                            <div>
                                                <div className="claim" key={`claim-${i}-${j}`} style={{ borderColor: getBackgroudColour(claim.type), borderWidth: '2px', borderStyle: 'solid' }}>
                                                    <p><GradientText text={claim.claim} state={claim.type} /></p>
                                                    {claim.type === 5 && <p><GradientText text={claim.processingText} state={processingTextState} /></p>}
                                                    {claim.answer && <p className="claim-answer">
                                                        {claim.type !== 4 && (
                                                            <span className="info-icon">
                                                                i
                                                                <span className="tooltip">
                                                                    Based only on the input text say whether the following claim is true or false? Reply with 'Correct', 'Incorrect', or 'Cannot Say'.
                                                                </span>
                                                            </span>
                                                        )}
                                                        <Typewriter text={claim.answer} />
                                                    </p>}
                                                    {claim.answer &&
                                                        <p className="claim-explanation">
                                                        Explanation:
                                                        <>
                                                            <span className="info-icon">
                                                                i
                                                                <span className="tooltip">
                                                                    {getExplanationInfo(claim.type)}
                                                                </span>
                                                            </span>
                                                            {claim.answer && !claim.explanation && <GradientText text={claim.processingText} state={5} />}
                                                            {claim.explanation && <Typewriter text={claim.explanation} />}
                                                        </>
                                                    </p>}
                                                    {claim.explanation && claim.type !== 3 && claim.type !== 4 && getReferenceInfo(claim.type, claim.references, claim.processingText)}
                                                    {claim.otherSourcesConsidered &&
                                                        <p className="claim-explanation">
                                                            Other sources found and considered during the online search:
                                                            <>
                                                                <span className="info-icon">
                                                                    i
                                                                    <span className="tooltip">
                                                                        The claim was analysed based on the top-5 search results. These are all the sources analysed, and the results of their analysis. 
                                                                    </span>
                                                                </span>
                                                                <div>
                                                                <Typewriter text={claim.otherSourcesConsidered} />
                                                                </div>
                                                            </>
                                                        </p>}
                                                    {/* {(claim.type !== 5 && (claim.references || claim.type === 4 || (claim.type === 5 && claim.explanation))) &&
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
                                                    </div>} */}
                                                </div>
                                            </div>
                                        </motion.div>
                                    ))}
                                </motion.div>
                            </AnimatePresence> </>}
                    {claims.length !== 0 && claims.every((c) => c.type === 4 || c.references || (c.type === 3 && c.explanation)) &&
                        <>
                            <div className="claim">
                                {<div className="dropdown">
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
                                </div>}
                            </div>
                            <button onClick={handleReload} className="button-big">
                                Reload
                            </button>
                        </>}
                    {reloading && <div className="loading-spinner">Reloading...</div>}
                </div>)}

        </div>
    )
}

export default SentenceComponent;