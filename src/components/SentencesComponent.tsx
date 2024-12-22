import React, { useState, useEffect } from 'react';
import "../styles/SentencesComponent.css";
import SentenceComponent from './SentenceComponent';

export type Claim = {
  "claim": string,
  "answer": string,
  "type": number,
  "classification": string,
  "explanation": string,
  "references": string,
}

export type Sentence = {
  sentence: string,
  claims: Array<Claim>,
  sources: Array<string>
}

interface SentencesComponentProps {
  inputSentences: Sentence[];
}

const SentencesComponent: React.FC<SentencesComponentProps> = ({ inputSentences }) => {
  const [sentences, setSentences] = useState<Sentence[]>(inputSentences);
  useEffect(() => {
    setSentences(inputSentences);
  }, [inputSentences]); 

  const [selectedTypes, setSelectedTypes] = useState<number[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');

  const filteredSentences = sentences.filter((sentence) => {
    const matchesSearch = sentence.sentence.toLowerCase().includes(debouncedSearchTerm.toLowerCase());
    const matchesType = selectedTypes.includes(1)
      ? sentence.claims.every((claim) => claim.type === 1)
      : selectedTypes.length === 0 ||
      sentence.claims.some((claim) => selectedTypes.includes(claim.type));
    return matchesSearch && matchesType;
  }
  );
  const handleTypeChange = (type) => {
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

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 300);

    return () => {
      clearTimeout(handler);
    };
  }, [searchTerm]);

  return (<div>
    {sentences.length !== 0 &&
      <div style={{ marginBottom: '1rem' }}>
        <input
          type="text"
          placeholder="Search sentences..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{
            padding: '0.5rem',
            width: '100%',
            boxSizing: 'border-box',
            borderRadius: '4px',
            border: '1px solid #ccc',
          }}
        />
      </div>
    }
    {sentences.length !== 0 &&
      <div style={{ marginBottom: '1rem' }}>
        <label style={{ marginRight: '0.5rem' }}>
          <input
            type="checkbox"
            value="2"
            checked={selectedTypes.includes(2)}
            onChange={() => handleTypeChange(2)}
          />
          Failed Checks
        </label>
        <label style={{ marginRight: '0.5rem' }}>
          <input
            type="checkbox"
            value="3"
            checked={selectedTypes.includes(3)}
            onChange={() => handleTypeChange(3)}
          />
          Not Given
        </label>
        <label style={{ marginRight: '0.5rem' }}>
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
    }
    <div className="claims-container">
      {filteredSentences.map((sentence, i) => (
        <SentenceComponent sentence={sentence} i={i} sources={sentence.sources}/>
      ))}
    </div>
  </div>
  );
};

export default SentencesComponent;