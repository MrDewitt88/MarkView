import React, { useState } from "react";

interface SpeakloneSetupProps {
  onClose: () => void;
  onComplete: (config: { token: string; endpoint: string; voice: string; temperature: number }) => void;
}

export function SpeakloneSetup({ onClose, onComplete }: SpeakloneSetupProps): React.JSX.Element {
  const [step, setStep] = useState(1);
  const [token, setToken] = useState("");
  const [endpoint, setEndpoint] = useState("http://localhost:7849");
  const [voice, setVoice] = useState("aiden");
  const [temperature, setTemperature] = useState(0.8);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<"success" | "fail" | null>(null);

  const handleTest = async (): Promise<void> => {
    setTesting(true);
    setTestResult(null);
    try {
      const available = await window.markview.ttsCheck(endpoint);
      if (!available) {
        setTestResult("fail");
        setTesting(false);
        return;
      }
      const result = await window.markview.ttsSpeak("MarkView ist bereit.", {
        endpoint,
        token,
        voice,
        temperature,
      });
      setTestResult(result.success ? "success" : "fail");
    } catch (err) {
      console.error("TTS test error:", err);
      setTestResult("fail");
    }
    setTesting(false);
  };

  const handleFinish = (): void => {
    onComplete({ token, endpoint, voice, temperature });
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-dialog speaklone-setup" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Speaklone Setup</h2>
          <button className="modal-close" onClick={onClose}>{"\u2715"}</button>
        </div>

        {step === 1 && (
          <div className="modal-body">
            <p>MarkView kann Dokumente vorlesen mit Speaklone.</p>
            <p>Du brauchst die Speaklone App und einen API-Token.</p>
            <div className="setup-actions">
              <button className="btn btn-primary" onClick={() => setStep(2)}>
                Weiter
              </button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="modal-body">
            <p className="setup-instruction">
              Speaklone &rarr; Settings &rarr; Local API &rarr; Copy Token
            </p>
            <label className="setup-label">
              Token
              <input
                type="password"
                className="setup-input"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                placeholder="API Token einfuegen"
                autoFocus
              />
            </label>
            <label className="setup-label">
              Endpoint
              <input
                type="text"
                className="setup-input"
                value={endpoint}
                onChange={(e) => setEndpoint(e.target.value)}
              />
            </label>
            <label className="setup-label">
              Voice
              <select
                className="setup-input"
                value={voice}
                onChange={(e) => setVoice(e.target.value)}
              >
                <option value="aiden">Aiden</option>
                <option value="ryan">Ryan</option>
                <option value="vivian">Vivian</option>
                <option value="serena">Serena</option>
                <option value="dylan">Dylan</option>
                <option value="eric">Eric</option>
                <option value="sohee">Sohee</option>
                <option value="ono_anna">Ono Anna</option>
                <option value="uncle_fu">Uncle Fu</option>
              </select>
            </label>
            <label className="setup-label">
              Temperature: {temperature.toFixed(1)}
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={temperature}
                onChange={(e) => setTemperature(parseFloat(e.target.value))}
              />
            </label>
            <div className="setup-actions">
              <button
                className="btn btn-secondary"
                onClick={handleTest}
                disabled={!token || testing}
              >
                {testing ? "Teste..." : "Verbindung testen"}
              </button>
              <button
                className="btn btn-primary"
                onClick={() => { handleFinish(); setStep(3); }}
                disabled={!token}
              >
                Speichern
              </button>
            </div>
            {testResult === "success" && (
              <p className="setup-result setup-success">Verbunden!</p>
            )}
            {testResult === "fail" && (
              <p className="setup-result setup-fail">Nicht erreichbar. Ist Speaklone gestartet?</p>
            )}
          </div>
        )}

        {step === 3 && (
          <div className="modal-body">
            <p className="setup-result setup-success">
              Einrichtung abgeschlossen! Du kannst jetzt Dokumente vorlesen.
            </p>
            <div className="setup-actions">
              <button className="btn btn-primary" onClick={onClose}>
                Fertig
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
