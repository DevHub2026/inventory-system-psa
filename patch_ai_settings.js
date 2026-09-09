const fs = require('fs');
const path = require('path');
const file = path.resolve('frontend/src/pages/SettingsPage.tsx');
let content = fs.readFileSync(file, 'utf8');

const aiSection = \
/* -- AI Settings Section (Admin Only) -- */
function AISettingsSection() {
  const [activeModel, setActiveModel] = useState<string>('');
  const [availableModels, setAvailableModels] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    aiService.getModels()
      .then(res => {
        if (res.success && res.data) {
          setActiveModel(res.data.active_model);
          setAvailableModels(res.data.available_models);
        } else {
          setError(res.message || 'Failed to load models.');
        }
      })
      .catch(err => {
        setError('Could not connect to AI service.');
      })
      .finally(() => setIsLoading(false));
  }, []);

  const handleSave = async (model: string) => {
    setIsSaving(true);
    setError('');
    setSuccess('');
    try {
      const res = await aiService.updateModel(model);
      if (res.success && res.data) {
        setActiveModel(res.data.active_model);
        setSuccess('AI Model updated successfully.');
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError(res.message || 'Failed to update model.');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update model.');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return <div style={{ padding: 24 }}>Loading AI settings...</div>;
  }

  return (
    <Section
      icon={<Bot size={20} />}
      iconBg={T.accentBg}
      iconColor={T.accent}
      title="AI Assistant Settings"
      subtitle="Manage the local AI model for the global assistant."
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {error && <Alert type="error">{error}</Alert>}
        {success && <Alert type="success">{success}</Alert>}
        
        <div style={{ fontSize: 13, color: T.textMid }}>
          Select the active model for the Local AI Assistant. This changes the model for all users instantly.
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {availableModels.map(model => {
            const isActive = model === activeModel;
            const isHeavy = model !== 'qwen2.5:3b';
            return (
              <div
                key={model}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '16px',
                  border: \\\1px solid \\\\\\,
                  borderRadius: 12,
                  background: isActive ? '#F8FAFF' : T.white,
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
                onClick={() => !isActive && !isSaving && handleSave(model)}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 600, color: T.text, fontSize: 14 }}>
                    {model}
                    {isActive && <span style={{ background: T.accent, color: T.white, fontSize: 10, padding: '2px 8px', borderRadius: 12 }}>Active</span>}
                  </div>
                  <div style={{ fontSize: 12, color: T.textMuted, marginTop: 4, display: 'flex', alignItems: 'center', gap: 6 }}>
                    {isHeavy ? (
                      <span style={{ color: T.amberText, display: 'flex', alignItems: 'center', gap: 4 }}>
                        <AlertTriangle size={14} /> ?? Heavier model. May significantly increase CPU usage, RAM consumption, and response latency on this 16 GB CPU-only server.
                      </span>
                    ) : (
                      <span style={{ color: '#059669' }}>
                        Recommended for this server. Lowest memory usage and best CPU responsiveness.
                      </span>
                    )}
                  </div>
                </div>
                
                <div style={{ paddingLeft: 16 }}>
                  {isSaving && !isActive ? (
                    <span style={{ fontSize: 12, color: T.textMuted }}>Saving...</span>
                  ) : isActive ? (
                    <div style={{ width: 24, height: 24, borderRadius: '50%', background: T.accent, display: 'grid', placeItems: 'center' }}>
                      <Check size={14} color={T.white} />
                    </div>
                  ) : (
                    <div style={{ width: 24, height: 24, borderRadius: '50%', border: \\\2px solid \\\\\\ }} />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </Section>
  );
}

\;

content = content.replace('/* ==================================================================', aiSection + '\\n/* ==================================================================');
fs.writeFileSync(file, content);
