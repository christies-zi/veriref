import React, { createContext, useContext, useState } from 'react';

type PdfContextType = {
    pdfFile: File | null;
    setPdfFile: (file: File | null) => void;
    inputText: string | null;
    setInputText: (text: string | null) => void;
};

const PdfContext = createContext<PdfContextType | undefined>(undefined);

export const PdfProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [pdfFile, setPdfFile] = useState<File | null>(null);
    const [inputText, setInputText] = useState<string | null >(null);

    return (
        <PdfContext.Provider value={{ pdfFile, setPdfFile, inputText, setInputText }}>
            {children}
        </PdfContext.Provider>
    );
};

export const usePdf = (): PdfContextType => {
    const context = useContext(PdfContext);
    if (!context) throw new Error('usePdf must be used within PdfProvider');
    return context;
};
