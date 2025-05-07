import React, { MutableRefObject, useEffect, useState } from 'react';
import { Sentence, Claim } from './SentencesComponent.tsx';
import "../styles/SentencesComponent.css";
import axios from 'axios';
import GradientText from './GradientText.tsx';
import Typewriter from './Typewriter.tsx';
import { motion, AnimatePresence } from "framer-motion";
import { use } from 'framer-motion/m';
import { ClaimTypes } from './CommonTypes';
import { useLocation, useNavigate } from 'react-router-dom';

interface SentenceComponentProps {
    sentenceExt: Sentence;
    i: number;
    onSentenceChange: (newSentence: Sentence, index: number) => void;
    typesToAnalyse: number[];
    processingText: string;
    processingTextState: number;
    clientId: string | null;
    processing: boolean;
    expandAll: boolean;
    hideAll: boolean;
}

type ExtendedClaim = Claim & { index: number, fadingOut: boolean };

const SentenceComponent: React.FC<SentenceComponentProps> = ({ sentenceExt, i, onSentenceChange, typesToAnalyse, processingText, processingTextState, clientId, processing, expandAll, hideAll }) => {
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
    const [removedClaimIndices, setRemovedClaimIndices] = useState<number[]>([]);


    useEffect(() => {
        if (!receivedAllClaims) return;

        // wrap and tag
        const extended = claims.map((c, i) => ({ ...c, index: i, fadingOut: false }));

        // split into keep vs. fade—but only fade those not already removed
        const keep = extended.filter(c => typesToAnalyse.includes(c.type));
        const fade = extended.filter(
            c => !typesToAnalyse.includes(c.type)
                && !removedClaimIndices.includes(c.index)
        );

        // sort keeps
        const orderMap = {
            [ClaimTypes.incorrect]: 1,
            [ClaimTypes.cannotSay]: 2,
            [ClaimTypes.mightBeCorrect]: 3,
            [ClaimTypes.noSource]: 4,
            [ClaimTypes.textNotRelated]: 5,
            [ClaimTypes.correct]: 6,
            [ClaimTypes.almostCorrect]: 7,
            [ClaimTypes.processing]: 8
        };
        keep.sort((a, b) => (orderMap[a.type] || 9) - (orderMap[b.type] || 9));

        // merge and render
        const merged = [...keep, ...fade];
        setSortedClaims(merged);

        // schedule fade‑out *once*
        const timers = fade.map(claim =>
            setTimeout(() => {
                // first animate out
                setSortedClaims(prev =>
                    prev.map(c =>
                        c.index === claim.index ? { ...c, fadingOut: true } : c
                    )
                );
                // then remove from UI and mark “gone for good”
                setTimeout(() => {
                    setSortedClaims(prev => prev.filter(c => c.index !== claim.index));
                    setRemovedClaimIndices(prev => [...prev, claim.index]);
                }, 200);
            }, 1000)
        );

        return () => timers.forEach(clearTimeout);
    }, [claims, typesToAnalyse, receivedAllClaims, removedClaimIndices]);

    useEffect(() => {
        setExpanded(true);
    }, [expandAll]);

    useEffect(() => {
        setExpanded(false);
    }, [hideAll]);

    useEffect(() => {
        setSentence((prevSentence) => ({
            ...prevSentence,
            sources: sentenceExt.sources,
            processingText: sentenceExt.processingText,
            processingTextState: sentenceExt.processingTextState,
            prevSentenceWithContext: sentenceExt.prevSentenceWithContext,
            keywords: sentenceExt.keywords,
            summary: sentenceExt.summary,
            paragraphSummary: sentenceExt.paragraphSummary,
        }));
    }, [sentenceExt]);

    useEffect(() => {
        setClaims(sentenceExt.claims);
        if (!receivedAllClaims && sentenceExt.claims.length > 0) {
            setReceivedAllClaims(true);
            setFilteredIndices(sentenceExt.claims.map((_, i) => i));
        }
    }, [sentence, sentenceExt, i]);

    const getExplanationInfo = (type) => {
        if (type === ClaimTypes.correct) return "Based only on the input text explain why the following claim is correct.";
        if (type === ClaimTypes.incorrect) return "Based only on the input text explain why the following claim is incorrect.";
        if (type === ClaimTypes.cannotSay) return "Based only on the input text explain why it is impossible to say whether following claim is correct or incorrect.";
        if (type === ClaimTypes.almostCorrect) return "Based only on the input text explain why the following claim is almost correct, but some small details might be wrong.";
        if (type === ClaimTypes.mightBeCorrect) return "Based only on the input text explain why the following claim might be correct, but the evidence in thetext might be indirect or uncertain."
        if (type === ClaimTypes.noSource) return "No source text was provided or could be fetched to analyse the claim";
        if (type === ClaimTypes.textNotRelated) return "The source text provided or fetched was not related to the claim. The issue could be in the web-scraping."
    };

    const countInCorrect = (claims: Array<Claim>) => claims.filter((c) => c.type === ClaimTypes.incorrect).length;
    const countNotGiven = (claims: Array<Claim>) => claims.filter((c) => c.type === ClaimTypes.cannotSay || c.type === ClaimTypes.noSource || c.type === ClaimTypes.textNotRelated).length;
    const countMightBeCorrect = (claims: Array<Claim>) => claims.filter((c) => c.type === ClaimTypes.mightBeCorrect).length;

    const getMessage = (claims: Array<Claim>) => {
        if (processingTextState === 0) {
            return <p>{processingText}</p>
        }
        if (claims.length === 0 || claims.some((c) => c.type === 5)) {
            return <><GradientText text={'Processing'} state={5} /></>
        }
        let incorrectCnt = countInCorrect(claims);
        let cannotSayCnt = countNotGiven(claims);
        let mightBeCorrectCnt = countMightBeCorrect(claims);

        return <>
            {incorrectCnt > 0 && (
                <span style={{ color: 'darkred' }}>{incorrectCnt} - ❌</span>
            )}
            {incorrectCnt > 0 && cannotSayCnt > 0 && ', '}
            {cannotSayCnt > 0 && (
                <span style={{ color: 'orange' }}>
                    {cannotSayCnt} - 🤷
                </span>
            )}
            {(incorrectCnt > 0 || cannotSayCnt > 0) && mightBeCorrectCnt > 0 && ', '}
            {mightBeCorrectCnt > 0 && (
                <span style={{ color: 'darkorange' }}>
                    {mightBeCorrectCnt} - 🥊
                </span>
            )}
            {incorrectCnt === 0 && cannotSayCnt === 0 && mightBeCorrectCnt === 0 && (
                <span style={{ color: 'darkgreen' }}>All Correct ✅ </span>
            )}
        </>
    };

    const getReferenceInfo = (type, references, processingText) => {
        if (type === ClaimTypes.correct)
            return <><p>Reference sentences:
                <span className="info-icon">i
                    <span className="tooltip">
                        Based only on the input text which specific setences from this text support the following claim?
                    </span>
                </span>
                {!references && <GradientText text={processingText} state={ClaimTypes.processing} />}
                {references && <Typewriter text={references.toString()} />}
            </p></>
        if (type === ClaimTypes.incorrect)
            return <><p>Reference sentences:
                <span className="info-icon">i
                    <span className="tooltip">
                        Based only on the input text which specific setences from this text contradict the following claim?
                    </span>
                </span>
                {!references && <GradientText text={processingText} state={ClaimTypes.processing} />}=
                {references && <Typewriter text={references.toString()} />}
            </p></>
        if (type === ClaimTypes.almostCorrect)
            return <><p>Reference sentences:
                <span className="info-icon">i
                    <span className="tooltip">
                        Based only on the input text which specific setences from this text prove that the following claim is almost correct?
                    </span>
                </span>
                {!references && <GradientText text={processingText} state={ClaimTypes.processing} />}
                {references && <Typewriter text={references.toString()} />}
            </p></>
        if (type === ClaimTypes.mightBeCorrect)
            return <><p>Reference sentences:
                <span className="info-icon">i
                    <span className="tooltip">
                        Based only on the input text which specific setences from this text prove that the following claim might be correct, but the evidence is controversial?
                    </span>
                </span>
                {!references && <GradientText text={processingText} state={ClaimTypes.processing} />}
                {references && <Typewriter text={references.toString()} />}
            </p></>
        return <></>;
    };

    const getBackgroudColour = (claimType: number | undefined | null) => {
        if (claimType === ClaimTypes.correct) return 'darkgreen'
        if (claimType === ClaimTypes.incorrect) return 'darkred'
        if (claimType === ClaimTypes.processing) return 'grey'
        if (claimType === ClaimTypes.almostCorrect) return 'green'
        if (claimType === ClaimTypes.mightBeCorrect) return 'darkorange'
        return 'orange'
    }

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
        setSentence(prev => {
            const newSentence = { ...prev, claims: [] };
            onSentenceChange(newSentence, i);
            return newSentence;
        });

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
            formData.append("clientId", JSON.stringify(clientId));
            formData.append("keywords", JSON.stringify(sentence.keywords));
            formData.append("summary", JSON.stringify(sentence.summary));
            formData.append("prevSentenceWithContext", JSON.stringify(sentence.prevSentenceWithContext));
            formData.append("paragraphSummary", JSON.stringify(sentence.paragraphSummary));
            formData.append("typesToAnalyse", JSON.stringify(typesToAnalyse));

            const response = await axios.post(`${BACKEND_SERVER}/add_source`, formData, {
                headers: {
                    "Access-Control-Allow-Origin": `${BACKEND_SERVER}/add_source`,
                    "Content-Type": "multipart/form-data",
                },
            });
            if (response.data.jobId) {
                const eventSource = new EventSource(`${BACKEND_SERVER}/launch_source_job/${response.data.jobId}/${clientId}`);

                eventSource.onmessage = (event) => {
                    let msg = JSON.parse(event.data);

                    if (msg.messageType === "end") {
                        eventSource.close();
                    } else if (msg.messageType === "claims") {

                        setSentence(prev => {
                            const newSentence: Sentence = { ...prev, claims: msg.claims as Claim[] };
                            onSentenceChange(newSentence, i);
                            return newSentence;
                        });

                        setFilteredIndices(msg.claims.map((_, i) => i));
                        setReceivedAllClaims(true);
                        setClaims(msg.claims);

                    } else if (msg.messageType === "claimNoResource") {
                        setClaims([msg.claim])
                        setSentence(prev => {
                            const newSentence = {
                                ...prev,
                                claims: [msg.claim]
                            };
                            onSentenceChange(newSentence, i);
                            return newSentence;
                        });
                    } else if (msg.messageType === "sentenceProcessingText") {
                        setSentence(prev => {
                            const newSentence = {
                                ...prev,
                                processingText: msg.processingText,
                                processingTextState: msg.processingTextState,
                                prevSentenceWithContext: msg.prevSentenceWithContext,
                                keywords: msg.keywords,
                                summary: msg.summary,
                                paragraphSummary: msg.paragraphSummary,
                            };
                            onSentenceChange(newSentence, i);
                            return newSentence;
                        }

                        );
                    } else if (msg.messageType === "claimProcessingText") {
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
            formData.append("clientId", JSON.stringify(clientId));
            formData.append("keywords", JSON.stringify(sentence.keywords));
            formData.append("summary", JSON.stringify(sentence.summary));
            formData.append("prevSentenceWithContext", JSON.stringify(sentence.prevSentenceWithContext));
            formData.append("paragraphSummary", JSON.stringify(sentence.paragraphSummary));
            formData.append("typesToAnalyse", JSON.stringify(typesToAnalyse));

            const response = await axios.post(`${BACKEND_SERVER}/analyse_sentence`, formData, {
                headers: {
                    "Access-Control-Allow-Origin": `${BACKEND_SERVER}/analyse_sentence`,
                    "Content-Type": "multipart/form-data",
                },
            });

            if (response.data.jobId) {
                const eventSource = new EventSource(`${BACKEND_SERVER}/launch_sentence_job/${response.data.jobId}/${clientId}`);

                eventSource.onmessage = (event) => {
                    let msg = JSON.parse(event.data);

                    if (msg.messageType === "end") {
                        eventSource.close();
                    } else if (msg.messageType === "claims") {

                        setSentence(prev => {
                            const newSentence: Sentence = { ...prev, claims: msg.claims as Claim[] };
                            onSentenceChange(newSentence, i);
                            return newSentence;
                        });

                        setFilteredIndices(msg.claims.map((_, i) => i));
                        setReceivedAllClaims(true);
                        setClaims(msg.claims);

                    } else if (msg.messageType === "claimNoResource") {
                        setClaims([msg.claim])
                        setSentence(prev => {
                            const newSentence = {
                                ...prev,
                                claims: [msg.claim]
                            };
                            onSentenceChange(newSentence, i);
                            return newSentence;
                        });
                    } else if (msg.messageType === "sentenceProcessingText") {
                        setSentence(prev => {
                            const newSentence = {
                                ...prev,
                                processingText: msg.processingText,
                                processingTextState: msg.processingTextState,
                                prevSentenceWithContext: msg.prevSentenceWithContext,
                                keywords: msg.keywords,
                                summary: msg.summary,
                                paragraphSummary: msg.paragraphSummary,
                            };
                            onSentenceChange(newSentence, i);
                            return newSentence;
                        }

                        );
                    } else if (msg.messageType === "claimProcessingText") {
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
            <div className="claim-details" style={{ display: expanded ? 'block' : 'none' }}>
                {claims.length === 0 && <div><GradientText text={processingText} state={processingTextState} /></div>}
                {claims.length !== 0 &&
                    <>
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
                                            <div className="claim-item">
                                                <div
                                                    className="claim"
                                                    key={`claim-${i}-${j}`}
                                                    style={{
                                                        borderColor: getBackgroudColour(claim.type),
                                                        borderWidth: '2px',
                                                        borderStyle: 'solid',
                                                    }}
                                                >
                                                    <p><GradientText text={claim.claim} state={claim.type} /></p>

                                                    {claim.type === ClaimTypes.processing && (
                                                        <div className="claim-section-block">
                                                            <GradientText text={claim.processingText} state={processingTextState} />
                                                        </div>
                                                    )}

                                                    {claim.answer && (
                                                        <div className="claim-section-block claim-answer-section">
                                                            <p className="claim-answer">
                                                                {claim.type !== ClaimTypes.noSource && claim.type !== ClaimTypes.textNotRelated && (
                                                                    <span className="info-icon">
                                                                        i
                                                                        <span className="tooltip">
                                                                            Based only on the input text say whether the following claim is true or false? Reply with 'Correct', 'Incorrect', or 'Cannot Say'.
                                                                        </span>
                                                                    </span>
                                                                )}
                                                                <Typewriter text={claim.answer} />
                                                            </p>
                                                        </div>
                                                    )}

                                                    {claim.answer && (
                                                        <div className="claim-section-block claim-explanation-section">
                                                            <p className="claim-explanation">
                                                                Explanation:
                                                                <span className="info-icon">
                                                                    i
                                                                    <span className="tooltip">{getExplanationInfo(claim.type)}</span>
                                                                </span>
                                                                {!claim.explanation && (
                                                                    <GradientText text={claim.processingText} state={ClaimTypes.processing} />
                                                                )}
                                                                {claim.explanation && <Typewriter text={claim.explanation} />}
                                                            </p>
                                                        </div>
                                                    )}

                                                    {claim.explanation && claim.references &&
                                                        claim.type !== ClaimTypes.textNotRelated &&
                                                        claim.type !== ClaimTypes.noSource && (
                                                            <div className="claim-section-block claim-references-section">
                                                                {getReferenceInfo(claim.type, claim.references, claim.processingText)}
                                                            </div>
                                                        )}

                                                    {claim.otherSourcesConsidered && (
                                                        <div className="claim-section-block">
                                                            <p className="claim-explanation">
                                                                Other sources found and considered during the online search:
                                                                <span className="info-icon">
                                                                    i
                                                                    <span className="tooltip">
                                                                        The claim was analysed based on the top-5 search results.
                                                                    </span>
                                                                </span>
                                                                <div><Typewriter text={claim.otherSourcesConsidered} /></div>
                                                            </p>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                        </div>
                                    </motion.div>
                                )
                                )}
                            </motion.div>
                        </AnimatePresence> </>}
                {claims.length !== 0 && claims.every((c) => c.type === ClaimTypes.noSource || c.references || (c.type === ClaimTypes.cannotSay && c.explanation) || c.type === ClaimTypes.textNotRelated) &&
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
                                        <div>
                                            <div className="tooltip-container">
                                                <button
                                                    onClick={handleSourceSubmit}
                                                    className={processing ? 'button-disabled' : 'button'}
                                                    disabled={processing}>
                                                    Submit
                                                </button>
                                                {processing && (
                                                    <span className="tooltip-text">Please, wait for the rest of the input to be processed</span>
                                                )}
                                            </div>
                                        </div>
                                        {loadingSource && <div className="loading-spinner">Loading...</div>}
                                    </div>
                                )}
                            </div>}
                        </div>
                        <div className="tooltip-container">
                            <button
                                onClick={handleReload}
                                className={processing ? 'button-big-disabled' : 'button-big'}
                                disabled={processing}
                            >
                                Reload
                            </button>
                            {processing && (
                                <span className="tooltip-text">Please, wait for the rest of the input to be processed</span>
                            )}
                        </div>


                    </>}
                {reloading && <div className="loading-spinner">Reloading...</div>}
            </div>

        </div>
    )
}

export default SentenceComponent;