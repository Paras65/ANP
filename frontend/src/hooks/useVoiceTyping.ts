import { useState, useEffect, useRef, useCallback } from 'react';

interface VoiceTypingOptions {
  lang?: string; // default 'hi-IN'
  onResult?: (text: string) => void;
  onError?: (error: string) => void;
  onInterim?: (interim: string) => void;
}

export function useVoiceTyping(options: VoiceTypingOptions = {}) {
  const { lang = 'hi-IN', onResult, onError, onInterim } = options;
  const [isListening, setIsListening] = useState(false);
  const [isSupported, setIsSupported] = useState(() => {
    if (typeof window === 'undefined') return false;
    return Boolean((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition);
  });
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Store callbacks in refs to avoid recreating recognition on component re-renders
  const onResultRef = useRef(onResult);
  const onErrorRef = useRef(onError);
  const onInterimRef = useRef(onInterim);

  useEffect(() => {
    onResultRef.current = onResult;
  }, [onResult]);

  useEffect(() => {
    onErrorRef.current = onError;
  }, [onError]);

  useEffect(() => {
    onInterimRef.current = onInterim;
  }, [onInterim]);

  const recognitionRef = useRef<any>(null);
  const shouldListenRef = useRef(false);
  const restartTimerRef = useRef<any>(null);

  // Initialize SpeechRecognition instance
  const initRecognition = useCallback(() => {
    const SpeechRecognitionClass = 
      (window as any).SpeechRecognition || 
      (window as any).webkitSpeechRecognition;

    if (!SpeechRecognitionClass) {
      setIsSupported(false);
      return null;
    }

    setIsSupported(true);

    try {
      const recognition = new SpeechRecognitionClass();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = lang;
      recognition.maxAlternatives = 1;

      recognition.onstart = () => {
        setIsListening(true);
        setErrorMessage(null);
      };

      recognition.onresult = (event: any) => {
        let interimText = '';
        let finalText = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const item = event.results[i];
          const text = item[0]?.transcript || '';
          if (item.isFinal) {
            finalText += (finalText ? ' ' : '') + text.trim();
          } else {
            interimText += (interimText ? ' ' : '') + text.trim();
          }
        }

        if (finalText) {
          if (onResultRef.current) {
            onResultRef.current(finalText);
          }
          setTranscript((prev) => (prev ? prev + ' ' + finalText : finalText));
        }

        setInterimTranscript(interimText);
        if (onInterimRef.current) {
          onInterimRef.current(interimText);
        }
      };

      recognition.onerror = (event: any) => {
        const err = event.error;
        console.warn('[SpeechRecognition Error]:', err);

        // 'no-speech' is a normal transient pause on desktop laptop; do NOT abort
        if (err === 'no-speech') {
          return;
        }

        if (err === 'aborted') {
          return;
        }

        if (err === 'not-allowed' || err === 'service-not-allowed') {
          shouldListenRef.current = false;
          setIsListening(false);
          const msg = 'माइक्रोफ़ोन की अनुमति अस्वीकृत है। कृपया ब्राउज़र URL बार में 🔒 या 🎙️ आइकॉन पर क्लिक करके "Allow Microphone" चुनें।';
          setErrorMessage(msg);
          if (onErrorRef.current) onErrorRef.current(msg);
          return;
        }

        if (err === 'audio-capture') {
          shouldListenRef.current = false;
          setIsListening(false);
          const msg = 'लैपटॉप का माइक्रोफ़ोन सक्रिय नहीं है। कृपया Windows Settings > Sound में माइक की जांच करें।';
          setErrorMessage(msg);
          if (onErrorRef.current) onErrorRef.current(msg);
          return;
        }

        if (err === 'network') {
          const msg = 'Google स्पीच नेटवर्क त्रुटि। कृपया इंटरनेट कनेक्शन जांचें।';
          setErrorMessage(msg);
          if (onErrorRef.current) onErrorRef.current(msg);
        }
      };

      recognition.onend = () => {
        setInterimTranscript('');
        // On laptop Chrome, speech recognition automatically halts on brief pauses;
        // auto-restart if user still has voice typing enabled!
        if (shouldListenRef.current) {
          clearTimeout(restartTimerRef.current);
          restartTimerRef.current = setTimeout(() => {
            if (shouldListenRef.current && recognitionRef.current) {
              try {
                recognitionRef.current.start();
                setIsListening(true);
              } catch (e: any) {
                if (e?.name !== 'InvalidStateError') {
                  setIsListening(false);
                  shouldListenRef.current = false;
                }
              }
            }
          }, 300);
        } else {
          setIsListening(false);
        }
      };

      recognitionRef.current = recognition;
      return recognition;
    } catch (e) {
      console.error('Failed to create SpeechRecognition instance:', e);
      setIsSupported(false);
      return null;
    }
  }, [lang]);

  // Start Voice Typing with robust laptop/desktop microphone check
  const startListening = useCallback(async () => {
    setErrorMessage(null);
    shouldListenRef.current = true;

    const SpeechRecognitionClass = 
      (window as any).SpeechRecognition || 
      (window as any).webkitSpeechRecognition;

    if (!SpeechRecognitionClass) {
      const err = 'आपके ब्राउज़र में आवाज़ पहचान (Web Speech API) समर्थित नहीं है। कृपया Google Chrome या Microsoft Edge का उपयोग करें।';
      setErrorMessage(err);
      if (onErrorRef.current) onErrorRef.current(err);
      return;
    }

    // On laptops, actively trigger browser permission dialog if not already granted
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        stream.getTracks().forEach((track) => track.stop());
      } catch (mediaErr: any) {
        if (mediaErr.name === 'NotAllowedError' || mediaErr.name === 'PermissionDeniedError') {
          shouldListenRef.current = false;
          setIsListening(false);
          const permMsg = 'माइक्रोफ़ोन अनुमति नहीं मिली। कृपया ब्राउज़र एड्रेस बार में 🔒 या 🎙️ आइकॉन पर क्लिक करके Microphone को "Allow" करें।';
          setErrorMessage(permMsg);
          if (onErrorRef.current) onErrorRef.current(permMsg);
          return;
        }
      }
    }

    if (!recognitionRef.current) {
      initRecognition();
    }

    try {
      if (recognitionRef.current) {
        recognitionRef.current.lang = lang;
        recognitionRef.current.start();
        setIsListening(true);
      }
    } catch (err: any) {
      if (err?.name === 'InvalidStateError') {
        // Recognition already active
        setIsListening(true);
      } else {
        console.warn('[Start listening failed]:', err);
      }
    }
  }, [lang, initRecognition]);

  // Stop Voice Typing
  const stopListening = useCallback(() => {
    shouldListenRef.current = false;
    clearTimeout(restartTimerRef.current);
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (err) {
        console.warn('[Stop listening error]:', err);
      }
    }
    setIsListening(false);
    setInterimTranscript('');
  }, []);

  // Toggle Voice Typing
  const toggleListening = useCallback(() => {
    if (isListening || shouldListenRef.current) {
      stopListening();
    } else {
      startListening();
    }
  }, [isListening, startListening, stopListening]);

  // Cleanup recognition on unmount
  useEffect(() => {
    return () => {
      shouldListenRef.current = false;
      clearTimeout(restartTimerRef.current);
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {
          // ignore
        }
      }
    };
  }, []);

  return {
    isListening,
    isSupported,
    transcript,
    interimTranscript,
    errorMessage,
    setTranscript,
    startListening,
    stopListening,
    toggleListening
  };
}
