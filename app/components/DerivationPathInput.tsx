import { useState, useEffect } from 'react';

interface DerivationPathInputProps {
  value: string;
  onChange: (path: string) => void;
  usedPaths?: string[];
  disabled?: boolean;
  onPresetSelect?: (preset: string) => void;
}

const STANDARD_PRESETS = [
  { label: 'Account 0', path: "m/44'/60'/0'/0/0", description: 'Standard first account' },
  { label: 'Account 1', path: "m/44'/60'/1'/0/0", description: 'Second account' },
  { label: 'Account 2', path: "m/44'/60'/2'/0/0", description: 'Third account' },
  { label: 'Account 3', path: "m/44'/60'/3'/0/0", description: 'Fourth account' },
  { label: 'Account 4', path: "m/44'/60'/4'/0/0", description: 'Fifth account' },
];

export default function DerivationPathInput({
  value,
  onChange,
  usedPaths = [],
  disabled = false,
  onPresetSelect
}: DerivationPathInputProps) {
  const [isCustom, setIsCustom] = useState(false);
  const [validationError, setValidationError] = useState('');

  useEffect(() => {
    const isPresetPath = STANDARD_PRESETS.some(preset => preset.path === value);
    setIsCustom(!isPresetPath && value !== '');
  }, [value]);

  const validateDerivationPath = (path: string): { isValid: boolean; error: string } => {
    if (!path.trim()) {
      return { isValid: false, error: 'Derivation path is required' };
    }

    const pathRegex = /^m\/44'\/60'\/\d+'\/\d+\/\d+$/;
    if (!pathRegex.test(path)) {
      return { 
        isValid: false, 
        error: 'Invalid format. Use: m/44\'/60\'/account\'/change/index (e.g., m/44\'/60\'/0\'/0/0)' 
      };
    }

    if (usedPaths.includes(path)) {
      return { isValid: false, error: 'This derivation path is already in use' };
    }

    const pathParts = path.split('/');
    const account = parseInt(pathParts[3].replace("'", ""));
    const change = parseInt(pathParts[4]);
    const index = parseInt(pathParts[5]);

    if (account < 0 || account > 2147483647) {
      return { isValid: false, error: 'Account index must be between 0 and 2147483647' };
    }

    if (change < 0 || change > 1) {
      return { isValid: false, error: 'Change index must be 0 (external) or 1 (internal)' };
    }

    if (index < 0 || index > 2147483647) {
      return { isValid: false, error: 'Address index must be between 0 and 2147483647' };
    }

    return { isValid: true, error: '' };
  };

  const handlePathChange = (newPath: string) => {
    const validation = validateDerivationPath(newPath);
    setValidationError(validation.error);
    onChange(newPath);
  };

  const handlePresetSelect = (preset: string) => {
    setIsCustom(false);
    setValidationError('');
    onChange(preset);
    onPresetSelect?.(preset);
  };

  const generateNextAvailablePath = (): string => {
    let account = 0;
    let path = `m/44'/60'/${account}'/0/0`;
    
    while (usedPaths.includes(path)) {
      account++;
      path = `m/44'/60'/${account}'/0/0`;
    }
    
    return path;
  };

  const nextAvailablePath = generateNextAvailablePath();
  const validation = validateDerivationPath(value);

  return (
    <div className="derivation-path-input">
      <div className="form-group">
        <label>Derivation Path</label>
        <div className="path-input-container">
          
          <div className="path-presets">
            <button
              type="button"
              onClick={() => handlePresetSelect(nextAvailablePath)}
              className={`path-preset ${!isCustom && value === nextAvailablePath ? 'active' : ''}`}
              disabled={disabled}
            >
              Next Available ({nextAvailablePath})
            </button>
            
            {STANDARD_PRESETS.map((preset) => (
              <button
                key={preset.path}
                type="button"
                onClick={() => handlePresetSelect(preset.path)}
                className={`path-preset ${!isCustom && value === preset.path ? 'active' : ''} ${usedPaths.includes(preset.path) ? 'used' : ''}`}
                disabled={disabled || usedPaths.includes(preset.path)}
                title={usedPaths.includes(preset.path) ? 'This path is already in use' : preset.description}
              >
                {preset.label}
                {usedPaths.includes(preset.path) && ' (Used)'}
              </button>
            ))}
            
            <button
              type="button"
              onClick={() => {
                setIsCustom(true);
                if (!value || STANDARD_PRESETS.some(p => p.path === value)) {
                  onChange('');
                }
              }}
              className={`path-preset ${isCustom ? 'active' : ''}`}
              disabled={disabled}
            >
              Custom Path
            </button>
          </div>

          {isCustom ? (
            <div className="custom-path-section">
              <input
                type="text"
                value={value}
                onChange={(e) => handlePathChange(e.target.value)}
                placeholder="m/44'/60'/0'/0/0"
                disabled={disabled}
                className={`form-input custom-path-input ${validation.isValid ? 'valid' : 'invalid'}`}
              />
              <div className="path-format-help">
                <h5>BIP-44 Path Format:</h5>
                <div className="format-breakdown">
                  <span className="format-part">m/44'/60'/</span>
                  <span className="format-part highlight">account'</span>
                  <span className="format-part">/</span>
                  <span className="format-part highlight">change</span>
                  <span className="format-part">/</span>
                  <span className="format-part highlight">index</span>
                </div>
                <ul>
                  <li><strong>account</strong>: Account number (0, 1, 2, ...)</li>
                  <li><strong>change</strong>: 0 for external addresses, 1 for internal (change)</li>
                  <li><strong>index</strong>: Address index within the account</li>
                </ul>
              </div>
            </div>
          ) : (
            <div className="selected-path-display">
              <div className="path-value">
                Selected: <code>{value || 'No path selected'}</code>
              </div>
              {value && (
                <div className="path-breakdown">
                  {(() => {
                    const parts = value.split('/');
                    const account = parts[3]?.replace("'", "");
                    const change = parts[4];
                    const index = parts[5];
                    return (
                      <div className="breakdown-text">
                        Account {account}, {change === '0' ? 'External' : 'Internal'} Chain, Address {index}
                      </div>
                    );
                  })()}
                </div>
              )}
            </div>
          )}

          {validationError && (
            <div className="validation-message invalid">
              ❌ {validationError}
            </div>
          )}

          {value && validation.isValid && (
            <div className="validation-message valid">
              ✅ Valid derivation path
            </div>
          )}
        </div>
      </div>

      {usedPaths.length > 0 && (
        <div className="used-paths-info">
          <h5>Used Paths ({usedPaths.length}):</h5>
          <div className="used-paths-list">
            {usedPaths.map((path, index) => (
              <code key={index} className="used-path">
                {path}
              </code>
            ))}
          </div>
        </div>
      )}

      <div className="path-info">
        <h5>Understanding Derivation Paths</h5>
        <div className="info-grid">
          <div className="info-item">
            <strong>Gap Detection:</strong>
            <p>Unused account numbers between used ones are detected and highlighted.</p>
          </div>
          <div className="info-item">
            <strong>Standard Practice:</strong>
            <p>Most wallets use sequential account numbers starting from 0.</p>
          </div>
          <div className="info-item">
            <strong>Address Types:</strong>
            <p>Change=0 for receiving, Change=1 for change addresses.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
