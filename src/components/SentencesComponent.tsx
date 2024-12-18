import React, { useState } from 'react';
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

const SentencesComponent = ({ sentences }) => {

  const [expandedClaims, setExpandedClaims] = useState<Array<boolean>>(
    new Array(sentences.length).fill(false)
  );

  const inCorrectClaimsCnts: Array<number> = sentences.map((sentence) => sentence.claims.filter((c) => c.type === 2).length);
  const notGivenClaimsCnts: Array<number> = sentences.map((sentence) => sentence.claims.filter((c) => c.type === 3).length);

  const toggleExpand = (index) => {
    const newExpandedClaims = [...expandedClaims];
    newExpandedClaims[index] = !newExpandedClaims[index];
    setExpandedClaims(newExpandedClaims);
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

  const getMessage = (incorrectCnt, cannotSayCnt) => {
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
    <div className="claims-container">
      {sentences.map((sentence, i) => (
        <div className='claim-section' key={`sentence-${i}`}>
          <div
            className="claim-header"
            onClick={() => toggleExpand(i)}
            style={{ cursor: 'pointer', display: 'flex', alignItems: 'center' }}
          >
            <p>{sentence.sentence}</p>
            <div style={{alignContent: 'right'}}>{getMessage(inCorrectClaimsCnts[i], notGivenClaimsCnts[i])}</div>
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
                    <span className="info-icon">i
                      <span className="tooltip">
                        Based only on the input text say whether the following claim is true or false? Reply with 'Correct', 'Incorrect', or 'Cannot Say'.
                      </span>
                    </span>
                  </p>
                  <p>Explanation:
                    <span className="info-icon">i
                      <span className="tooltip">
                        {getExplanationInfo(claim.type)}
                      </span>
                    </span>{claim.explanation}
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