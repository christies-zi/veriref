import React, { useState, useEffect, MutableRefObject } from 'react';
import "../styles/SentencesComponent.css";
import SentenceComponent from './SentenceComponent';
import { ClaimTypes } from '../App';

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
  inputSentences: Sentence[];
  onSentencesChange: (newSentences: Sentence[]) => void;
  typesToAnalyse: number[];
  clientId: MutableRefObject<string>;
}

const SentencesComponent: React.FC<SentencesComponentProps> = ({ inputSentences, onSentencesChange, typesToAnalyse, clientId }) => {
  const [sentences, setSentences] = useState<Sentence[]>(inputSentences);
  const [selectedTypes, setSelectedTypes] = useState<number[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');

  useEffect(() => {
    setSentences(inputSentences);
  }, [inputSentences]);

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
      onSentencesChange(newSentences);
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

  const sentencePassesFilter = sentences.map((sentence) => {
    const matchesSearch = sentence.sentence.toLowerCase().includes(debouncedSearchTerm.toLowerCase());
    const matchesType = selectedTypes.includes(ClaimTypes.correct)
      ? sentence.claims.every((claim) => claim.type === ClaimTypes.correct)
      : selectedTypes.length === 0 ||
        sentence.claims.some((claim) => selectedTypes.includes(claim.type));
    return matchesSearch && matchesType;
  });

  return (
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
          <div className="filter-options">
            <label>
              <input
                type="checkbox"
                value={ClaimTypes.incorrect.toString()}
                checked={selectedTypes.includes(ClaimTypes.incorrect)}
                onChange={() => handleTypeChange(ClaimTypes.incorrect)}
              />
              Failed Checks
            </label>
            <label>
              <input
                type="checkbox"
                value={ClaimTypes.cannotSay.toString()}
                checked={selectedTypes.includes(ClaimTypes.cannotSay)}
                onChange={() => handleTypeChange(ClaimTypes.cannotSay)}
              />
              Not Given
            </label>
            <label>
              <input
                type="checkbox"
                value={ClaimTypes.noSource.toString()}
                checked={selectedTypes.includes(ClaimTypes.noSource)}
                onChange={() => handleTypeChange(ClaimTypes.noSource)}
              />
              Could Not Access Resources
            </label>
            <label>
              <input
                type="checkbox"
                value={ClaimTypes.correct.toString()}
                checked={selectedTypes.includes(ClaimTypes.correct)}
                onChange={() => handleTypeChange(ClaimTypes.correct)}
              />
              All Correct
            </label>
            <label>
              <input
                type="checkbox"
                value={ClaimTypes.textNotRelated.toString()}
                checked={selectedTypes.includes(ClaimTypes.textNotRelated)}
                onChange={() => handleTypeChange(ClaimTypes.textNotRelated)}
              />
              Source Text Irrelevant
            </label>
            <label>
              <input
                type="checkbox"
                value={ClaimTypes.almostCorrect.toString()}
                checked={selectedTypes.includes(ClaimTypes.almostCorrect)}
                onChange={() => handleTypeChange(ClaimTypes.almostCorrect)}
              />
              Almost Correct
            </label>
            <label>
              <input
                type="checkbox"
                value={ClaimTypes.mightBeCorrect.toString()}
                checked={selectedTypes.includes(ClaimTypes.mightBeCorrect)}
                onChange={() => handleTypeChange(ClaimTypes.mightBeCorrect)}
              />
              Might Be Correct/Controversial
            </label>
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
            />
          ) : null
        )}
      </div>
    </div>
  );
};

export default SentencesComponent;
