
// import React, { useEffect } from 'react';

// interface TypewriterProps {
//     text: string | undefined;
//     speed: number;
//     displayedText: string | undefined;
//     setDisplayedText: (index: number, value: string) => void; // Correct typing for setState
//     index: number;
// }

// const Typewriter: React.FC<TypewriterProps> = ({ text, speed, displayedText, setDisplayedText, index }) => {
//     useEffect(() => {
//         if (displayedText === text) return; // Do nothing if the text is already fully typed

//         if (text != undefined && displayedText != undefined) {
//             let i = displayedText.length;

//             const type = () => {
//                 if (i < text.length) {
//                     setDisplayedText(index, displayedText + text[i]); // Functional update
//                     i++;
//                 }
//             };

//             const interval = setInterval(type, speed);

//             // Clear interval when typing is done or on unmount
//             if (index === text.length) {
//                 clearInterval(interval);
//             }

//             return () => clearInterval(interval);
//         } else {
//             return;
//         }
//     }, [text, speed, displayedText, setDisplayedText, index]);

//     return <div>{displayedText}</div>;
// };

// export default Typewriter;
import React, {useState, useEffect} from 'react';

const DEFAULT_MS = 10;

export interface ITypewriterProps {
    text: string | undefined | null | string[];
    speed?: number;
    loop?: boolean;
    random?: number;
    delay?: number;
    cursor?: boolean;
    onFinished?: Function;
    onStart?: Function;
}

export default function Typewriter({text, speed = DEFAULT_MS, loop = false, random = DEFAULT_MS, delay = DEFAULT_MS, cursor = true, onFinished = () => {}, onStart = () => {}}: ITypewriterProps) {
    const formatListString = (input: string): (string | JSX.Element)[] => {
        // Split string at list items and process each part
        return input
          .split(/(?=\d+\.\s+)/) // Lookahead for enumerated list items
          .flatMap((part, index) => {
            // Format bold text in the current part
            const formattedPart = part.split(/(\*\*.*?\*\*)/).map((subPart, subIndex) => {
              if (/^\*\*.*\*\*$/.test(subPart)) {
                // Remove ** and wrap in <strong>
                return (
                  <strong key={`bold-${index}-${subIndex}`}>
                    {subPart.slice(2, -2)}
                  </strong>
                );
              }
              return subPart; // Non-bold text remains as is
            });
      
            // Add a <br /> before list parts (not the first part)
            if (index > 0) {
              return [<br key={`br-${index}`} />, ...formattedPart];
            }
            return formattedPart;
          });
      };

    const [currentStringIndex, setCurrentStringIndex] = useState(0);
    const [currentTextIndex, setCurrentTextIndex] = useState(0);

    if (!text) text = ""
    if (!Array.isArray(text))
        text = [text]

    useEffect( () => {
        setTimeout( () => {
            if (currentTextIndex === 0)
                onStart();
            if (currentTextIndex < text[currentStringIndex].length) {
                setCurrentTextIndex(currentTextIndex + 1);
            } else {
                if (currentStringIndex < text.length-1) {
                    setTimeout( () => {
                        setCurrentTextIndex(0);
                        setCurrentStringIndex( currentStringIndex + 1);
                    }, delay);
                } else {
                    if (loop) {
                        setTimeout( () => {
                            setCurrentTextIndex(0);
                            setCurrentStringIndex(0);
                        }, delay);
                    } else {
                        
                        onFinished();
                    }
                }
            }
        }, speed + (Math.random() * random));
    });

    return (
        <span>
            {
                formatListString(text[currentStringIndex].substring(0, currentTextIndex))
            }
        </span>
    );
}



