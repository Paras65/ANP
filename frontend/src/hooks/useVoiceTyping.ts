import { useState, useEffect, useRef, useCallback } from 'react';

interface VoiceTypingOptions {
  lang?: string; // default 'hi-IN'
  onResult?: (text: string) => void;
  onError?: (error: string) => void;
}

export function useVoiceTyping(options: VoiceTypingOptions = {}) {
  const { lang = 'hi-IN', onResult, onError } = options;
  const [isListening, setIsListening] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const [transcript, setTranscript] = useState('');
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    const SpeechRecognition = 
      (window as any).SpeechRecognition || 
      (window as any).webkitSpeechRecognition;

    if (SpeechRecognition) {
      setIsSupported(true);
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = lang;

      recognition.onresult = (event: any) => {
        let currentTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const item = event.results[i];
          if (item.isFinal) {
            const finalChunk = item[0].transcript;
            currentTranscript += finalChunk;
            if (onResult) onResult(finalChunk);
          }
        }
        if (currentTranscript) {
          setTranscript((prev) => (prev ? prev + ' ' + currentTranscript : currentTranscript));
        }
      };

      recognition.onerror = (event: any) => {
        console.warn('[SpeechRecognition Error]:', event.error);
        setIsListening(false);
        if (onError) onError(event.error);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    } else {
      setIsSupported(false);
    }

    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {
          // ignore
        }
      }
    };
  }, [lang, onResult, onError]);

  const startListening = useCallback(() => {
    if (!recognitionRef.current) return;
    try {
      recognitionRef.current.lang = lang;
      recognitionRef.current.start();
      setIsListening(true);
    } catch (err: any) {
      console.warn('[Start listening failed]:', err);
    }
  }, [lang]);

  const stopListening = useCallback(() => {
    if (!recognitionRef.current) return;
    try {
      recognitionRef.current.stop();
      setIsListening(false);
    } catch (err: any) {
      console.warn('[Stop listening failed]:', err);
    }
  }, []);

  const toggleListening = useCallback(() => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  }, [isListening, startListening, stopListening]);

  return {
    isListening,
    isSupported,
    transcript,
    setTranscript,
    startListening,
    stopListening,
    toggleListening
  };
}

