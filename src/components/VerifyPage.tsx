import React, { useState, useRef, useEffect } from "react";
import axios from "axios";
import "../styles/App.css";
import "./SentencesComponent"
import SentencesComponent, { Sentence } from "./SentencesComponent";
import GradientText from "./GradientText";
import { None } from "framer-motion";
import Typewriter from "./Typewriter";
import { v4 as uuidv4 } from 'uuid';
import Select from 'react-select';
import { ClaimTypes } from "../App.tsx";
import { useNavigate } from 'react-router-dom';
import { usePdf } from "./PdfContext.tsx";

function VerifyPage() {
    const isLocal = true;
    const clientId = useRef<string>(uuidv4())
    const BACKEND_SERVER = isLocal ? "http://127.0.0.1:5000" : process.env.REACT_APP_BACKEND_SERVER;
    const [fileInput, setFileInput] = useState(null); // Stores the uploaded PDF file
    const [textInput, setTextInput] = useState(""); // Stores plain text input
    const [errorMessage, setErrorMessage] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [sentences, setSentences] = useState<Sentence[]>([]);
    const [processingInput, setProcessingInput] = useState(true);
    const [claimTypesToAnalyse, setClaimTypesToAnalyse] = useState<number[]>(Array.from({ length: ClaimTypes.textNotRelated - ClaimTypes.correct + 1 }, (_, i) => ClaimTypes.correct + i));
    const [infoText, setInfoText] = useState<string | null>(null);
    const [infoTextState, setInfoTextState] = useState<number>(5);
    const { setPdfFile, setInputText, inputText, pdfFile } = usePdf();
    const navigate = useNavigate();


    const claimOptions = [
        { value: ClaimTypes.incorrect, label: '❌ Wrong' },
        { value: ClaimTypes.cannotSay, label: '🤷 Inconclusive' },
        { value: ClaimTypes.noSource, label: '⛔ Could Not Access Source' },
        { value: ClaimTypes.correct, label: '✅ Correct' },
        { value: ClaimTypes.almostCorrect, label: '☑️ Almost Correct' },
        { value: ClaimTypes.mightBeCorrect, label: '🥊 Controversial' },
        { value: ClaimTypes.textNotRelated, label: '⚠️ Error scraping the source.' },
    ];

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
        setProcessingInput(true);
        if (!fileInput && !textInput) {
            setErrorMessage("Please upload a PDF or provide text for Input 1 and fill Input 2.");
            return;
        }
        setIsLoading(true);
        setSentences([]);
        setInfoTextState(ClaimTypes.processing);
        setInfoText("Loading");

        try {
            const formData = new FormData();
            if (fileInput) {
                formData.append("file", fileInput);
                setPdfFile(fileInput);
                setInputText(null);
            } else if (textInput) {
                formData.append("textInput", textInput);
                setInputText(textInput);
                setPdfFile(null);
            }

            formData.append("typesToAnalyse", JSON.stringify(claimTypesToAnalyse));
            formData.append("clientId", JSON.stringify(clientId.current));

            const response = await axios.post(`${BACKEND_SERVER}/process`, formData, {
                headers: {
                    "Access-Control-Allow-Origin": `${BACKEND_SERVER}/process`,
                    "Content-Type": "multipart/form-data",
                },
            });

            if (response.data.jobId) {
                const jobId = response.data.jobId;
                const numbers = claimTypesToAnalyse;
                const numberString = numbers.join(',');
                navigate(`/result?jobId=${encodeURIComponent(jobId)}&clientId=${encodeURIComponent(clientId.current)}&numbers=${numberString}`);

                // const eventSource = new EventSource(`${BACKEND_SERVER}/launch_processing_job/${response.data.jobId}/${clientId.current}`);

                // eventSource.onmessage = (event) => {
                //     let msg = JSON.parse(event.data);

                //     if (msg.messageType === "end") {
                //         eventSource.close();
                //         setProcessingInput(false);
                //     } else if (msg.messageType === "sentences") {
                //         setSentences(msg.sentences);
                //     } else if (msg.messageType === "claims") {
                //         setSentences((prevSentences) =>
                //             prevSentences.map((sentence, k) =>
                //                 k === msg.sentenceIndex ? { ...sentence, claims: msg.claims } : sentence
                //             )
                //         );
                //     } else if (msg.messageType === "claimAnswer") {
                //         setSentences((prevSentences) =>
                //             prevSentences.map((sentence, k) =>
                //                 k === msg.sentenceIndex
                //                     ? {
                //                         ...sentence,
                //                         claims: sentence.claims.map((claim, idx) =>
                //                             idx === msg.claimIndex ? msg.claim : claim
                //                         )
                //                     }
                //                     : sentence
                //             )
                //         );
                //     } else if (msg.messageType === "claimExplanation") {
                //         setSentences((prevSentences) =>
                //             prevSentences.map((sentence, k) =>
                //                 k === msg.sentenceIndex
                //                     ? {
                //                         ...sentence,
                //                         claims: sentence.claims.map((claim, idx) =>
                //                             idx === msg.claimIndex ? msg.claim : claim
                //                         )
                //                     }
                //                     : sentence
                //             )
                //         );
                //     } else if (msg.messageType === "claimReferences") {
                //         setSentences((prevSentences) =>
                //             prevSentences.map((sentence, k) =>
                //                 k === msg.sentenceIndex
                //                     ? {
                //                         ...sentence,
                //                         claims: sentence.claims.map((claim, idx) =>
                //                             idx === msg.claimIndex ? msg.claim : claim
                //                         )
                //                     }
                //                     : sentence
                //             )
                //         );
                //     } else if (msg.messageType === "claimNoResource") {
                //         setSentences((prevSentences) =>
                //             prevSentences.map((sentence, k) =>
                //                 k === msg.sentenceIndex ? { ...sentence, claims: [msg.claim] } : sentence
                //             )
                //         );
                //     } else if (msg.messageType === "sentenceProcessingTextSources") {
                //         setSentences((prevSentences) =>
                //             prevSentences.map((sentence, k) =>
                //                 k === msg.sentenceIndex ? {
                //                     ...sentence,
                //                     processingText: msg.processingText,
                //                     processingTextState: msg.processingTextState,
                //                     prevSentenceWithContext: msg.prevSentenceWithContext,
                //                     keywords: msg.keywords,
                //                     summary: msg.summary,
                //                     paragraphSummary: msg.paragraphSummary,
                //                     sources: msg.sources
                //                 } : sentence
                //             )
                //         );
                //     } else if (msg.messageType === "sentenceProcessingText") {
                //         setSentences((prevSentences) =>
                //             prevSentences.map((sentence, k) =>
                //                 k === msg.sentenceIndex ? {
                //                     ...sentence,
                //                     processingText: msg.processingText,
                //                     processingTextState: msg.processingTextState,
                //                     prevSentenceWithContext: msg.prevSentenceWithContext,
                //                     keywords: msg.keywords,
                //                     summary: msg.summary,
                //                     paragraphSummary: msg.paragraphSummary,
                //                 } : sentence
                //             )
                //         );
                //     } else if (msg.messageType === "claimProcessingText") {
                //         setSentences((prevSentences) =>
                //             prevSentences.map((sentence, k) =>
                //                 k === msg.sentenceIndex
                //                     ? {
                //                         ...sentence,
                //                         claims: sentence.claims.map((claim, idx) =>
                //                             idx === msg.claimIndex ? msg.claim : claim
                //                         )
                //                     }
                //                     : sentence
                //             )
                //         );
                //     } else if (msg.messageType === "generalMessage") {
                //         setInfoTextState(msg.messageState);
                //         setInfoText(msg.message);
                //     }
                // };

            }

        } catch (error) {
            console.error("Error processing inputs:", error);
        } finally {
            setIsLoading(false);
        }
    };

    function waitForStreamCompletion(url: string): Promise<void> {
        return new Promise((resolve, reject) => {
            const eventSource = new EventSource(url);

            eventSource.onmessage = (event) => {
                try {
                    const msg = JSON.parse(event.data);
                    if (msg.messageType === "ending") {
                        eventSource.close();
                        resolve();
                    }
                } catch (err) {
                    console.error("Error parsing message", err, event.data);
                }
            };

            eventSource.onerror = (err) => {
                console.error("EventSource failed", err);
                eventSource.close();
                reject(err);
            };
        });
    }


    const handleFileRequest = async () => {
        const formData = new FormData();
        if (fileInput) {
            formData.append("file", fileInput);
        } else if (textInput) {
            formData.append("textInput", textInput);
        }

        formData.append("sentences", JSON.stringify(sentences));
        formData.append("typesToAnalyse", JSON.stringify(claimTypesToAnalyse));
        formData.append("clientId", JSON.stringify(clientId.current));

        const response = await axios.post(`${BACKEND_SERVER}/request_pdf`, formData, {
            headers: {
                "Access-Control-Allow-Origin": `${BACKEND_SERVER}/request_pdf`,
            },
        });

        const jobId = response.data.jobId;

        if (response.data.jobId) {
            const streamUrl = `${BACKEND_SERVER}/generate_pdf/${response.data.jobId}/${clientId.current}`;
            await waitForStreamCompletion(streamUrl);
        }

        const formDataNew = new FormData();
        formDataNew.append("jobId", jobId);
        formDataNew.append("clientId", JSON.stringify(clientId.current));

        try {
            const response = await axios.post(`${BACKEND_SERVER}/get_pdf`, formDataNew, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
                responseType: 'blob',
            });


            const blob = new Blob([response.data], { type: 'application/pdf' });
            const url = window.URL.createObjectURL(blob);


            const link = document.createElement('a');
            link.href = url;
            link.download = 'output.pdf';
            link.click();
            window.URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Error:', error);
            alert('Something went wrong. Please try again.');
        }
    };

    const handleSentencesChange = (newSentences: Sentence[]) => {
        setSentences(newSentences);
    };

    const handleTypesToAnalyseChange = (type: number) => {
        setClaimTypesToAnalyse((prev) =>
            prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
        );
    };

    const handleClaimTypesChange = (selectedTypes: ClaimTypes[]) => {
        setClaimTypesToAnalyse(selectedTypes);
    };


    return (
        <div>
            <div className="input-section">
                <div className="input-group centered">
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

                    <div className="or-divider">or</div>

                    <textarea
                        placeholder="Enter plain text"
                        value={textInput}
                        onChange={handleAdjustHeight}
                        onInput={handleTextInput}
                        className="input-textarea"
                        rows={4}
                    />
                </div>
            </div>

            {errorMessage && <p className="error-message">{errorMessage}</p>}

            <div className="input-group">
                <div className="select-group">
                    <label className="input-label">Select claim types to analyse:</label>
                    <Select
                        options={claimOptions}
                        isMulti
                        value={claimOptions
                            .filter(option => claimTypesToAnalyse.includes(option.value))
                            // We need to keep both 'value' and 'label' properties to display the label in the selected items
                        }
                        onChange={(selected) => {
                            const selectedValues = (selected as unknown as { value: ClaimTypes }[]).map(opt => opt.value);
                            setClaimTypesToAnalyse(selectedValues);
                        }}
                        className="multi-select"
                        classNamePrefix="select"
                    />
                </div>


            </div>

            {!isLoading &&
            <button onClick={handleSubmit} className="submit-button">
                Submit
            </button>} 
            {isLoading && 
                <div className="centered-text">
                    <GradientText text="Loading..." state={ClaimTypes.processing} />
                </div>
            }

            {/* {infoText && (
                <>
                    {infoTextState === ClaimTypes.processing ? (
                        <div className="centered-text">
                            <GradientText text={infoText} state={infoTextState} />
                        </div>
                    ) : (
                        <div className="centered-text">
                            <Typewriter text={infoText} />
                        </div>
                    )}
                </>
            )}

            {sentences.length > 0 && (
                <>
                    <h3 className="section-title">Detailed sentence-by-sentence analysis:</h3>
                    <SentencesComponent
                        inputSentences={sentences}
                        onSentencesChange={handleSentencesChange}
                        typesToAnalyse={claimTypesToAnalyse}
                        clientId={clientId}
                    />
                </>
            )}

            {!processingInput && (
                <button onClick={handleFileRequest} className="submit-button">
                    Generate Report
                </button>
            )} */}
        </div>

    );
}

export default VerifyPage;
