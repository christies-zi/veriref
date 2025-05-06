import React, { useState, useEffect, MutableRefObject } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import "../styles/SentencesComponent.css";
import SentenceComponent from './SentenceComponent';
import { claimOptions, ClaimTypes } from './CommonTypes';
import { usePdf } from './PdfContext.tsx';
import GradientText from './GradientText.tsx';
import Typewriter from './Typewriter.tsx';
import axios from 'axios';
import Select from 'react-select';

export type Claim = {
  claim: string;
  answer: string;
  type: number;
  classification: string;
  explanation: string;
  references: string;
  processingText: string;
  otherSourcesConsidered: string;
};

export type Sentence = {
  sentence: string;
  claims: Array<Claim>;
  sources: Array<string>;
  processingText: string;
  processingTextState: number;
  prevSentenceWithContext: string;
  keywords: Array<string>;
  summary: string;
  paragraphSummary: string;
};

interface SentencesComponentProps {
  jobID: string;
  typesToAnalyse: number[];
  clientId: string;
}

const SentencesComponent: React.FC = () => {
  const [searchParams] = useSearchParams();
  const jobId = searchParams.get('jobId');
  const clientId = searchParams.get('clientId');
  const numbersParam = searchParams.get('numbers');
  const typesToAnalyse = numbersParam
    ? numbersParam.split(',').map(n => parseInt(n, 10))
    : [];
  const [sentences, setSentences] = useState<Sentence[]>([]);
  const [selectedTypes, setSelectedTypes] = useState<number[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [infoText, setInfoText] = useState<string | null>(null);
  const [infoTextState, setInfoTextState] = useState<number>(ClaimTypes.processing);
  const { setPdfFile, setInputText, inputText, pdfFile } = usePdf();
  const [processing, setProcessing] = useState<boolean>(true);
  const isLocal = true;
  const BACKEND_SERVER = isLocal ? "http://127.0.0.1:5000" : process.env.REACT_APP_BACKEND_SERVER;

  useEffect(() => {
    setInfoText("Loading...");
    setProcessing(true);

    if (!jobId || !clientId || !numbersParam) {
      setInfoText("Something went wrong... Try submitting again...");
      setInfoTextState(ClaimTypes.correct);
      return;
    };

    const eventSource = new EventSource(`${BACKEND_SERVER}/launch_processing_job/${jobId}/${clientId}`);
    setProcessing(true);
    eventSource.onmessage = (event) => {
      let msg = JSON.parse(event.data);
      if (msg.messageType === "end") {
        eventSource.close();
        setProcessing(false);
      } else if (msg.messageType === "sentences") {
        setSentences(msg.sentences);
      } else if (msg.messageType === "claims") {
        setSentences((prevSentences) =>
          prevSentences.map((sentence, k) =>
            k === msg.sentenceIndex ? { ...sentence, claims: msg.claims } : sentence
          )
        );
      } else if (msg.messageType === "claimAnswer") {
        setSentences((prevSentences) =>
          prevSentences.map((sentence, k) =>
            k === msg.sentenceIndex
              ? {
                ...sentence,
                claims: sentence.claims.map((claim, idx) =>
                  idx === msg.claimIndex ? msg.claim : claim
                )
              }
              : sentence
          )
        );
      } else if (msg.messageType === "claimExplanation") {
        setSentences((prevSentences) =>
          prevSentences.map((sentence, k) =>
            k === msg.sentenceIndex
              ? {
                ...sentence,
                claims: sentence.claims.map((claim, idx) =>
                  idx === msg.claimIndex ? msg.claim : claim
                )
              }
              : sentence
          )
        );
      } else if (msg.messageType === "claimReferences") {
        setSentences((prevSentences) =>
          prevSentences.map((sentence, k) =>
            k === msg.sentenceIndex
              ? {
                ...sentence,
                claims: sentence.claims.map((claim, idx) =>
                  idx === msg.claimIndex ? msg.claim : claim
                )
              }
              : sentence
          )
        );
      } else if (msg.messageType === "claimNoResource") {
        setSentences((prevSentences) =>
          prevSentences.map((sentence, k) =>
            k === msg.sentenceIndex ? { ...sentence, claims: [msg.claim] } : sentence
          )
        );
      } else if (msg.messageType === "sentenceProcessingTextSources") {
        setSentences((prevSentences) =>
          prevSentences.map((sentence, k) =>
            k === msg.sentenceIndex ? {
              ...sentence,
              processingText: msg.processingText,
              processingTextState: msg.processingTextState,
              prevSentenceWithContext: msg.prevSentenceWithContext,
              keywords: msg.keywords,
              summary: msg.summary,
              paragraphSummary: msg.paragraphSummary,
              sources: msg.sources
            } : sentence
          )
        );
      } else if (msg.messageType === "sentenceProcessingText") {
        setSentences((prevSentences) =>
          prevSentences.map((sentence, k) =>
            k === msg.sentenceIndex ? {
              ...sentence,
              processingText: msg.processingText,
              processingTextState: msg.processingTextState,
              prevSentenceWithContext: msg.prevSentenceWithContext,
              keywords: msg.keywords,
              summary: msg.summary,
              paragraphSummary: msg.paragraphSummary,
            } : sentence
          )
        );
      } else if (msg.messageType === "claimProcessingText") {
        setSentences((prevSentences) =>
          prevSentences.map((sentence, k) =>
            k === msg.sentenceIndex
              ? {
                ...sentence,
                claims: sentence.claims.map((claim, idx) =>
                  idx === msg.claimIndex ? msg.claim : claim
                )
              }
              : sentence
          )
        );
      } else if (msg.messageType === "generalMessage") {
        setInfoTextState(msg.messageState);
        setInfoText(msg.message);
      }
    };
  }, [jobId]);


  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 300);

    return () => {
      clearTimeout(handler);
    };
  }, [searchTerm]);

  const handleSentenceChange = (newSentence: Sentence, index: number) => {
    setSentences(prevSentences => {
      const newSentences = prevSentences.map((sentence, i) => (i === index ? newSentence : sentence));
      return newSentences
    }
    );
  };

  const handleTypeChange = (type: number) => {
    setSelectedTypes((prevSelected) => {
      if (type === ClaimTypes.correct) {
        return prevSelected.includes(ClaimTypes.correct) ? [] : [ClaimTypes.correct];
      } else {
        if (prevSelected.includes(type)) {
          return prevSelected.filter((t) => t !== type);
        } else {
          return [...prevSelected.filter((t) => t !== ClaimTypes.correct), type];
        }
      }
    });
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
    if (pdfFile) {
      formData.append("file", pdfFile);
    } else if (inputText) {
      formData.append("textInput", inputText);
    }

    formData.append("sentences", JSON.stringify(sentences));
    formData.append("typesToAnalyse", JSON.stringify(typesToAnalyse));
    formData.append("clientId", JSON.stringify(clientId));

    const response = await axios.post(`${BACKEND_SERVER}/request_pdf`, formData, {
      headers: {
        "Access-Control-Allow-Origin": `${BACKEND_SERVER}/request_pdf`,
      },
    });

    const jobId = response.data.jobId;

    if (response.data.jobId) {
      const streamUrl = `${BACKEND_SERVER}/generate_pdf/${response.data.jobId}/${clientId}`;
      await waitForStreamCompletion(streamUrl);
    }

    const formDataNew = new FormData();
    formDataNew.append("jobId", jobId);
    formDataNew.append("clientId", JSON.stringify(clientId));

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

  const sentencePassesFilter = sentences.map((sentence) => {
    const matchesSearch = sentence.sentence.toLowerCase().includes(debouncedSearchTerm.toLowerCase());
    const matchesType = selectedTypes.includes(ClaimTypes.correct)
      ? sentence.claims.every((claim) => claim.type === ClaimTypes.correct)
      : selectedTypes.length === 0 ||
      sentence.claims.some((claim) => selectedTypes.includes(claim.type));
    return matchesSearch && matchesType;
  });

  return (
    <div className="main-section">
      {sentences.length > 0 && (
        <>
          <h3 className="section-title">Detailed sentence-by-sentence analysis:</h3>
          {infoText && (
            <div>
              {infoTextState === ClaimTypes.processing ? (
                <div className="centered-text">
                  <GradientText text={infoText} state={infoTextState} />
                </div>
              ) : (
                <div className="centered-text">
                  <Typewriter text={infoText} />
                </div>
              )}
            </div>
          )}
          <div className="sentences-container">
            {sentences.length > 0 && (
              <>
                <div className="search-bar">
                  <input
                    type="text"
                    placeholder="Search sentences..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>

                  <div className="select-group">
                    <label>Select claim types to analyse:</label>
                    <Select
                      options={claimOptions}
                      isMulti
                      value={claimOptions.filter(option => selectedTypes.includes(option.value))}
                      onChange={(selected) => {
                        const selectedValues = (selected as unknown as { value: ClaimTypes }[]).map(opt => opt.value);
                        setSelectedTypes(selectedValues);
                      }}
                      className="multi-select"
                      classNamePrefix="select"
                    />
                  </div>
              </>
            )}
          <div className="claims-container">
            {sentences.map((sentence, i) =>
              sentencePassesFilter[i] ? (
                <SentenceComponent
                  key={i}
                  sentenceExt={sentence}
                  i={i}
                  onSentenceChange={handleSentenceChange}
                  typesToAnalyse={typesToAnalyse}
                  processingText={sentence.processingText}
                  processingTextState={sentence.processingTextState}
                  clientId={clientId}
                  processing={processing}
                />
              ) : null
            )}
          </div>
        </div>
    </>)
}
{
  !processing && (
    <button onClick={handleFileRequest} className="submit-button">
      Generate Report
    </button>
  )
}
    </div >
  );
};

export default SentencesComponent;
