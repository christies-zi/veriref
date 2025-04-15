import React, { useState, useEffect } from 'react';
import "../styles/SentencesComponent.css";
import SentenceComponent from './SentenceComponent';

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
};

interface SentencesComponentProps {
  inputSentences: Sentence[];
  onSentencesChange: (newSentences: Sentence[]) => void;
  typesToAnalyse: number[];
}

const SentencesComponent: React.FC<SentencesComponentProps> = ({ inputSentences, onSentencesChange, typesToAnalyse }) => {
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
      if (type === 1) {
        return prevSelected.includes(1) ? [] : [1];
      } else {
        if (prevSelected.includes(type)) {
          return prevSelected.filter((t) => t !== type);
        } else {
          return [...prevSelected.filter((t) => t !== 1), type];
        }
      }
    });
  };

  const sentencePassesFilter = sentences.map((sentence) => {
    const matchesSearch = sentence.sentence.toLowerCase().includes(debouncedSearchTerm.toLowerCase());
    const matchesType = selectedTypes.includes(1)
      ? sentence.claims.every((claim) => claim.type === 1)
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
                value="2"
                checked={selectedTypes.includes(2)}
                onChange={() => handleTypeChange(2)}
              />
              Failed Checks
            </label>
            <label>
              <input
                type="checkbox"
                value="3"
                checked={selectedTypes.includes(3)}
                onChange={() => handleTypeChange(3)}
              />
              Not Given
            </label>
            <label>
              <input
                type="checkbox"
                value="4"
                checked={selectedTypes.includes(4)}
                onChange={() => handleTypeChange(4)}
              />
              Could Not Access Resources
            </label>
            <label>
              <input
                type="checkbox"
                value="1"
                checked={selectedTypes.includes(1)}
                onChange={() => handleTypeChange(1)}
              />
              All Correct
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
            />
          ) : null
        )}
      </div>
    </div>
  );
};

export default SentencesComponent;
