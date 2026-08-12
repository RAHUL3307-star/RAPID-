import React, { useState } from 'react';
import type { PumpMode } from '../../lib/aiDecisionEngine';
import { supabase } from '../../lib/supabaseClient';

interface PumpControlProps {
  currentMode: PumpMode;
  onModeChange?: (mode: PumpMode) => void;
}

export const PumpControl: React.FC<PumpControlProps> = ({ currentMode, onModeChange }) => {
  const [selected, setSelected] = useState<PumpMode>(currentMode);
  const [saving, setSaving] = useState(false);

  React.useEffect(() => { setSelected(currentMode); }, [currentMode]);

  const handleSelect = async (mode: PumpMode) => {
    if (mode === selected) return;
    setSelected(mode);
    setSaving(true);

    try {
      if (supabase) {
        await supabase.from('pump_commands').insert({
          command: mode,
          source: 'MANUAL',
          operator_note: `Manual override to ${mode} speed`,
        });
      }
      onModeChange?.(mode);
    } catch (e) {
      console.error('[PumpControl] Failed to save command', e);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        marginBottom: 'var(--space-sm)',
      }}>
        <span style={{ fontSize: 12, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
          MANUAL OVERRIDE
        </span>
        {saving && (
          <span style={{ fontSize: 11, color: 'var(--accent-cyan)' }}>Saving…</span>
        )}
      </div>

      <div className="pump-controls">
        {(['OFF', 'LOW', 'HIGH'] as PumpMode[]).map(mode => (
          <button
            key={mode}
            id={`pump-btn-${mode.toLowerCase()}`}
            className={`pump-btn ${mode.toLowerCase()} ${selected === mode ? 'selected' : ''}`}
            onClick={() => handleSelect(mode)}
            aria-pressed={selected === mode}
          >
            <span className="pump-btn-icon">
              {mode === 'OFF' ? '⏹️' : mode === 'LOW' ? '💧' : '🌊'}
            </span>
            {mode}
          </button>
        ))}
      </div>

      <div style={{
        marginTop: 'var(--space-md)',
        padding: '8px 12px',
        background: 'var(--bg-glass-light)',
        borderRadius: 'var(--radius-sm)',
        fontSize: 11,
        color: 'var(--text-muted)',
        fontFamily: 'var(--font-mono)',
      }}>
        ⚠️ Manual override disables AI auto-control until reset
      </div>
    </div>
  );
};
