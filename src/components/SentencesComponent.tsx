import React, { useState, useEffect } from 'react';
import "../styles/SentencesComponent.css";

type Claim = {
  "claim": string,
  "answer": string,
  "type": number,
  "classification": string,
  "explanation": string,
  "references": string
}

export type Sentence = {
  sentence: string,
  claims: Array<Claim>
}

interface SentencesComponentProps {
  display: boolean;
  sentences: Sentence[];
}

const SentencesComponent: React.FC<SentencesComponentProps> = ({ display, sentences }) => {
  const [selectedTypes, setSelectedTypes] = useState<number[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [expandedClaims, setExpandedClaims] = useState<Array<boolean>>(
    new Array(sentences.length).fill(false)
  );
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

  const toggleExpand = (index: number) => {
    const updatedExpandedClaims = [...expandedClaims];
    updatedExpandedClaims[index] = !updatedExpandedClaims[index];
    setExpandedClaims(updatedExpandedClaims);
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

  const countInCorrect = (claims : Array<Claim>) => claims.filter((c) => c.type === 2).length;
  const countNotGiven = (claims : Array<Claim>) => claims.filter((c) => c.type === 3 || c.type === 4).length;

  const getMessage = (claims : Array<Claim>) => {
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

  return (<div>
    {display && sentences.length !== 0 &&
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
    {display && sentences.length !== 0 &&
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
        <div className='claim-section' key={`sentence-${i}`}>
          <div
            className="claim-header"
            onClick={() => toggleExpand(i)}
            style={{ cursor: 'pointer', display: 'flex', alignItems: 'center' }}
          >
            <p>{sentence.sentence}</p>
            <div style={{ alignContent: 'right' }}>{getMessage(sentence.claims)}</div>
            <span className={`dropdown-arrow${expandedClaims[i] ? '.open' : ''}`}>
              ▼
            </span>
          </div>
          {expandedClaims[i] && (
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
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  </div>
  );
};

export default SentencesComponent;