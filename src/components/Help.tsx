import React from 'react';
import "../styles/Help.css";
import image_1 from '../assets/input_example.png';
import image_2 from '../assets/report_example.png';

const Help: React.FC = () => {
  return (
    <div className="help-container">
      <h1 className="help-title">Help & Instructions</h1>

      <section className="help-section">
        <h2>Input Formatting</h2>
        <p>
          You can submit either a <strong>PDF document</strong> or a <strong>plain text</strong> input.
          Any sources must be cited in <strong>Vancouver referencing style</strong>, with a reference list at the end
          of the text. This list must be preceded by either <code>"References"</code> or <code>"References:"</code>.
        </p>
        <p>If references are not provided, the system will attempt to search for them online.</p>
        <p><strong>Example:</strong></p>
        <img
          src={image_1}
          alt="Reference example"
          className="example-image"
        />
      </section>

      <section className="help-section">
        <h2>Claim Types</h2>
        <ul className="claim-types">
          <li>✅ <strong>Correct</strong>: The claim is fully supported by the source.</li>
          <li>☑️ <strong>Almost Correct</strong>: Mostly supported but contains small issues.</li>
          <li>❌ <strong>Wrong</strong>: Clearly contradicted by the source.</li>
          <li>🤷 <strong>Cannot say/Inconclusive</strong>: Relevant content exists, but not enough to verify.</li>
          <li>⛔ <strong>Could Not Access Source Text</strong>: The system could not retrieve or read the source.</li>
          <li>🥊 <strong>Controversial</strong>: Mixed support or highly disputed information.</li>
          <li>⚠️ <strong>Error Scraping The Source / Could Get Only Metadata</strong>: Only metadata found or scraping issue occurred.</li>
        </ul>
      </section>

      <section className="help-section">
        <h2>Report Generation</h2>
        <p>
          After analysis, a verification report can be generated in PDF format.
          The text will be annotated with highlights to indicate the factual accuracy of each claim:
        </p>
        <ul>
          <li><span className="highlight red">❌ Wrong</span></li>
          <li><span className="highlight yellow">🤷 Cannot say / ⛔ Could Not Access Source Text</span></li>
          <li><span className="highlight dark-green">✅ Correct</span></li>
          <li><span className="highlight light-green">☑️ Almost Correct</span></li>
          <li><span className="highlight orange">🥊 Controversial</span></li>
        </ul>
        <p>
          Each highlighted segment will include a tooltip with a short explanation of the verification result.
        </p>
        <p><strong>Example:</strong></p>
        <img
          src={image_2}
          alt="Annotated text example"
          className="example-image"
        />
      </section>
    </div>
  );
};

export default Help;
