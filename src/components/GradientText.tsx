// import React, { useEffect, useState } from 'react';
// import '../styles/GradientText.css';

// interface GradientTextProps {
//   text: string;
//   state: number; // Add the `state` prop
// }

// const GradientText: React.FC<GradientTextProps> = ({ text, state }) => {
//   const [style, setStyle] = useState<React.CSSProperties>({
//     backgroundImage: 'linear-gradient(90deg, #2e2e2e, #d3d3d3, #2e2e2e, #d3d3d3)', // Initial gradient
//     backgroundSize: '300% 300%',
//     backgroundPosition: '0% 50%',
//     WebkitBackgroundClip: 'text',
//     WebkitTextFillColor: 'transparent',
//     transition: 'background-image 1s ease-in-out', // Smooth transition
//   });

//   useEffect(() => {
//     if (state === 5) {
//       setStyle((prevStyle) => ({
//         ...prevStyle,
//         animation: 'gradient-shift 3s linear infinite',
//         backgroundImage: 'linear-gradient(90deg, #2e2e2e, #d3d3d3, #2e2e2e, #d3d3d3)', // Original gradient
//       }));
//     } else {
//       setStyle((prevStyle) => ({
//         ...prevStyle,
//         backgroundImage: 'linear-gradient(90deg, #006400, #006400)', // Transition to dark green
//       }));
//     }
//   }, [state]);

//   return <div className="gradientText" style={style}>{text}</div>;
// };

// export default GradientText;






import React, { useEffect, useState } from 'react';
import '../styles/GradientText.css';
import { ClaimTypes } from './CommonTypes';

interface GradientTextProps {
  text: string;
  state: number;
}

const GradientText: React.FC<GradientTextProps> = ({ text, state }) => {
  const [style, setStyle] = useState<React.CSSProperties>({
    backgroundImage: 'linear-gradient(90deg, #2e2e2e, #d3d3d3, #2e2e2e, #d3d3d3)',
    backgroundSize: '300% 300%',
    backgroundPosition: '0% 50%',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    animation: 'gradient-shift 3s linear infinite',
  });

  useEffect(() => {
    if (state === ClaimTypes.processing) {
      setStyle({
        backgroundImage: 'linear-gradient(90deg, #2e2e2e, #d3d3d3, #2e2e2e, #d3d3d3)', 
        backgroundSize: '300% 300%',
        backgroundPosition: '0% 50%',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        animation: 'gradient-shift 3s linear infinite', 
        transition: 'background-image 1s ease-in-out',
      });
    } else if (state === ClaimTypes.correct) {
      setStyle({
        backgroundImage: 'linear-gradient(90deg, darkgreen, darkgreen)', 
        backgroundSize: '300% 300%',
        backgroundPosition: '0% 50%',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        animation: 'gradient-shift 3s linear infinite',
        transition: 'background-image 1s ease-in-out',
      });
    } else if (state == ClaimTypes.almostCorrect) {
      setStyle({
        backgroundImage: 'linear-gradient(90deg, green, green)', 
        backgroundSize: '300% 300%',
        backgroundPosition: '0% 50%',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        animation: 'gradient-shift 3s linear infinite',
        transition: 'background-image 1s ease-in-out',
      });
    } else if (state === ClaimTypes.incorrect) {
      setStyle({
        backgroundImage: 'linear-gradient(90deg, darkred, darkred)', 
        backgroundSize: '300% 300%',
        backgroundPosition: '0% 50%',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        animation: 'gradient-shift 3s linear infinite',
        transition: 'background-image 1s ease-in-out',
      });      
    } else if (state === ClaimTypes.mightBeCorrect) {
      setStyle({
        backgroundImage: 'linear-gradient(90deg, darkorange, darkorange)', 
        backgroundSize: '300% 300%',
        backgroundPosition: '0% 50%',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        animation: 'gradient-shift 3s linear infinite',
        transition: 'background-image 1s ease-in-out',
      });      
    }else if (state === ClaimTypes.notAnalysing) {
      setStyle({
        backgroundImage: 'linear-gradient(90deg, #555555, #555555)', 
        backgroundSize: '300% 300%',
        backgroundPosition: '0% 50%',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        animation: 'gradient-shift 3s linear infinite',
        transition: 'background-image 1s ease-in-out',
      });        
    } else {
      setStyle({
        backgroundImage: 'linear-gradient(90deg, orange, orange)', 
        backgroundSize: '300% 300%',
        backgroundPosition: '0% 50%',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        animation: 'gradient-shift 3s linear infinite',
        transition: 'background-image 1s ease-in-out',
      });   
    }
  }, [state]);

  return <div className="gradientText" style={style}>{text}</div>;
};

export default GradientText;


