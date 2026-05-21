import { useState } from 'react';
import Head from 'next/head';
import '../styles/globals.css';

const QUESTIONS = [
  {
    id: 'mood', label: 'Step 1 of 6', text: 'What kind of mood are you in right now?',
    cols: 2,
    options: [
      { emoji: '😄', main: 'Want to laugh', sub: 'Comedy, lighthearted stuff' },
      { emoji: '🥺', main: 'Feel something', sub: 'Drama, emotional' },
      { emoji: '😮', main: 'Something gripping', sub: 'Thriller, mystery' },
      { emoji: '🛋️', main: 'Just switch off', sub: 'Easy, no thinking needed' },
      { emoji: '✨', main: 'Be inspired', sub: 'Documentary, true story' },
      { emoji: '🚀', main: 'Escape reality', sub: 'Sci-fi, fantasy, adventure' },
    ]
  },
  {
    id: 'company', label: 'Step 2 of 6', text: 'Who are you watching with?',
    cols: 2,
    options: [
      { emoji: '🙋', main: 'Just me', sub: 'Solo meal, solo pick' },
      { emoji: '❤️', main: 'Partner', sub: 'Something you both enjoy' },
      { emoji: '👨‍👩‍👧', main: 'Family', sub: 'Kids might be around' },
      { emoji: '🎉', main: 'Friends', sub: 'Group vibe' },
    ]
  },
  {
    id: 'time', label: 'Step 3 of 6', text: 'How much time do you have?',
    cols: 2,
    options: [
      { emoji: '⚡', main: 'Under 30 min', sub: 'Quick episode or short' },
      { emoji: '🕐', main: 'About an hour', sub: 'One ep or a short film' },
      { emoji: '🎬', main: 'Full movie', sub: 'Happy to commit 2 hrs' },
      { emoji: '📺', main: 'Start a series', sub: 'Open to binge mode' },
    ]
  },
  {
    id: 'energy', label: 'Step 4 of 6', text: 'How much attention do you want to give it?',
    cols: 2,
    options: [
      { emoji: '👀', main: 'Fully watching', sub: "I'll pay attention" },
      { emoji: '😌', main: 'Half-watching', sub: "It's background mostly" },
    ]
  },
  {
    id: 'language', label: 'Step 5 of 6', text: 'Language preference?',
    cols: 3,
    options: [
      { emoji: '🇮🇳', main: 'Hindi', sub: '' },
      { emoji: '🇬🇧', main: 'English', sub: '' },
      { emoji: '🎵', main: 'Tamil', sub: '' },
      { emoji: '🇰🇷', main: 'Korean', sub: '' },
      { emoji: '🇪🇸', main: 'Spanish', sub: '' },
      { emoji: '🌍', main: 'Any language', sub: 'Open to subtitles' },
    ]
  },
  {
    id: 'streaming', label: 'Step 6 of 6', text: 'What are you streaming on?',
    cols: 3,
    options: [
      { emoji: '🔴', main: 'Netflix', sub: '' },
      { emoji: '🎥', main: 'Prime Video', sub: '' },
      { emoji: '🏏', main: 'Hotstar', sub: '' },
      { emoji: '▶️', main: 'YouTube', sub: '' },
      { emoji: '📱', main: 'SonyLiv', sub: '' },
      { emoji: '🎲', main: 'Any / not sure', sub: '' },
    ]
  }
];

const STAR_RATING = (rating) => {
  if (!rating) return null;
  const pct = Math.round((rating / 10) * 100);
  return `${rating}/10`;
};

export default function Home() {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState({});
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const progress = step >= QUESTIONS.length ? 100 : Math.round((step / QUESTIONS.length) * 100);
  const currentQ = QUESTIONS[step];
  const selected = currentQ ? answers[currentQ.id] : null;

  function select(qid, val) {
    setAnswers(prev => ({ ...prev, [qid]: val }));
  }

  function next() {
    if (!answers[currentQ.id]) return;
    if (step === QUESTIONS.length - 1) {
      submit();
    } else {
      setStep(s => s + 1);
    }
  }

  function back() {
    if (step > 0) setStep(s => s - 1);
  }

  function restart() {
    setStep(0);
    setAnswers({});
    setResult(null);
    setError(null);
  }

  async function submit() {
    setStep(QUESTIONS.length);
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/recommend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answers }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Something went wrong');
      setResult(data);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Head>
        <title>WhatDoIWatch — find something to watch while you eat</title>
        <meta name="description" content="Answer 6 quick questions and get a personalised recommendation for what to watch during your meal." />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,500;1,400&family=DM+Sans:wght@300;400;500;600&display=swap" rel="stylesheet" />
      </Head>

      <main style={styles.main}>
        <div style={styles.card}>

          {/* Header */}
          <div style={styles.header}>
            <h1 style={styles.title}>WhatDoIWatch?</h1>
            <p style={styles.subtitle}>
              {loading ? 'Searching for your perfect match...' :
               result ? 'Here\'s what to watch tonight.' :
               'Answer 6 quick questions while your food heats up.'}
            </p>
          </div>

          {/* Progress bar */}
          <div style={styles.progressBar}>
            <div style={{ ...styles.progressFill, width: `${progress}%` }} />
          </div>

          {/* Loading state */}
          {loading && (
            <div style={styles.loadingArea}>
              <div style={styles.spinner} />
              <p style={styles.loadingText}>Finding what's on for you in India...</p>
              <p style={{ ...styles.loadingText, fontSize: 12, opacity: 0.5 }}>Checking your streaming library</p>
            </div>
          )}

          {/* Error state */}
          {error && !loading && (
            <div style={styles.resultArea}>
              <div style={styles.errorBox}>
                <p style={styles.errorTitle}>Couldn't get a recommendation</p>
                <p style={styles.errorDetail}>{error}</p>
              </div>
              <button style={styles.restartBtn} onClick={restart}>↺ Try again</button>
            </div>
          )}

          {/* Result state */}
          {result && !loading && (
            <div style={styles.resultArea}>
              {/* Primary recommendation */}
              <div style={styles.recoCard}>
                {result.primary.poster && (
                  <div style={styles.posterRow}>
                    <img
                      src={result.primary.poster}
                      alt={result.primary.title}
                      style={styles.poster}
                    />
                    <div style={styles.posterMeta}>
                      <div style={styles.recoBadge}>{result.primary.type}</div>
                      <h2 style={styles.recoTitle}>{result.primary.title}</h2>
                      <p style={styles.recoSubMeta}>
                        {result.primary.year}
                        {result.primary.language && ` · ${result.primary.language}`}
                        {result.primary.rating && ` · ⭐ ${STAR_RATING(result.primary.rating)}`}
                      </p>
                      {result.primary.streamingProviders?.length > 0 && (
                        <div style={styles.streamBadge}>
                          ✓ On {result.primary.streamingProviders.join(', ')}
                        </div>
                      )}
                      {!result.primary.streamingMatch && result.primary.allProviders?.length > 0 && (
                        <div style={{ ...styles.streamBadge, background: 'rgba(255,200,100,0.1)', color: '#f0c060' }}>
                          Also on: {result.primary.allProviders.slice(0, 2).join(', ')}
                        </div>
                      )}
                    </div>
                  </div>
                )}
                {!result.primary.poster && (
                  <>
                    <div style={styles.recoHeaderNoPoster}>
                      <h2 style={styles.recoTitle}>{result.primary.title}</h2>
                      <div style={styles.recoBadge}>{result.primary.type}</div>
                    </div>
                    <p style={styles.recoSubMeta}>
                      {result.primary.year}
                      {result.primary.language && ` · ${result.primary.language}`}
                      {result.primary.rating && ` · ⭐ ${STAR_RATING(result.primary.rating)}`}
                    </p>
                  </>
                )}
                <p style={styles.recoWhy}>{result.primary.why}</p>
                {result.primary.overview && (
                  <p style={styles.recoOverview}>{result.primary.overview}</p>
                )}
              </div>

              {/* Alternatives */}
              {result.alternatives?.length > 0 && (
                <>
                  <p style={styles.altLabel}>Also worth considering</p>
                  <div style={styles.altList}>
                    {result.alternatives.map((alt, i) => (
                      <div key={i} style={styles.altItem}>
                        {alt.poster && (
                          <img src={alt.poster} alt={alt.title} style={styles.altPoster} />
                        )}
                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                            <span style={styles.altTitle}>{alt.title}</span>
                            <span style={styles.altType}>{alt.type}</span>
                            {alt.streamingMatch && (
                              <span style={styles.altStreamBadge}>✓</span>
                            )}
                          </div>
                          <p style={styles.altWhy}>{alt.why}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}

              <button style={styles.restartBtn} onClick={restart}>↺ Start over</button>
            </div>
          )}

          {/* Questionnaire */}
          {!loading && !result && !error && currentQ && (
            <div style={styles.qArea}>
              <p style={styles.qLabel}>{currentQ.label}</p>
              <p style={styles.qText}>{currentQ.text}</p>

              <div style={{
                ...styles.optGrid,
                gridTemplateColumns: currentQ.cols === 3 ? '1fr 1fr 1fr' : '1fr 1fr'
              }}>
                {currentQ.options.map(opt => (
                  <button
                    key={opt.main}
                    onClick={() => select(currentQ.id, opt.main)}
                    style={{
                      ...styles.optBtn,
                      ...(selected === opt.main ? styles.optBtnSelected : {})
                    }}
                  >
                    <span style={styles.optEmoji}>{opt.emoji}</span>
                    <span style={styles.optMain}>{opt.main}</span>
                    {opt.sub && <span style={styles.optSub}>{opt.sub}</span>}
                  </button>
                ))}
              </div>

              <div style={styles.navRow}>
                {step > 0 && (
                  <button style={styles.backBtn} onClick={back}>← Back</button>
                )}
                <button
                  style={{ ...styles.nextBtn, opacity: selected ? 1 : 0.35, cursor: selected ? 'pointer' : 'default' }}
                  onClick={next}
                  disabled={!selected}
                >
                  {step === QUESTIONS.length - 1 ? 'Find my watch →' : 'Next →'}
                </button>
              </div>
            </div>
          )}

        </div>

        <p style={styles.footer}>Made for every meal 🍽️</p>
      </main>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        .opt-btn-hover:hover { border-color: #d4a94a !important; }
      `}</style>
    </>
  );
}

const styles = {
  main: {
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '24px 16px',
    background: '#0f0d0a',
  },
  card: {
    width: '100%',
    maxWidth: 520,
    background: '#151209',
    border: '0.5px solid rgba(255,255,255,0.08)',
    borderRadius: 16,
    overflow: 'hidden',
    animation: 'fadeIn 0.3s ease',
  },
  header: {
    background: '#1a1108',
    padding: '24px 28px 20px',
    borderBottom: '0.5px solid rgba(255,255,255,0.06)',
  },
  title: {
    fontFamily: "'Playfair Display', serif",
    fontSize: 24,
    color: '#f5e6c8',
    fontWeight: 500,
    marginBottom: 4,
    letterSpacing: '-0.3px',
  },
  subtitle: {
    fontSize: 13,
    color: 'rgba(245,230,200,0.45)',
    fontWeight: 300,
  },
  progressBar: {
    height: 2,
    background: 'rgba(255,255,255,0.06)',
  },
  progressFill: {
    height: '100%',
    background: '#d4a94a',
    transition: 'width 0.4s ease',
  },
  qArea: {
    padding: '24px 28px',
  },
  qLabel: {
    fontSize: 11,
    fontWeight: 500,
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
    color: 'rgba(245,230,200,0.35)',
    marginBottom: 6,
  },
  qText: {
    fontFamily: "'Playfair Display', serif",
    fontSize: 19,
    color: '#f5e6c8',
    marginBottom: 20,
    lineHeight: 1.4,
  },
  optGrid: {
    display: 'grid',
    gap: 8,
    marginBottom: 20,
  },
  optBtn: {
    background: 'rgba(255,255,255,0.03)',
    border: '0.5px solid rgba(255,255,255,0.08)',
    borderRadius: 10,
    padding: '10px 12px',
    cursor: 'pointer',
    textAlign: 'left',
    display: 'flex',
    flexDirection: 'column',
    gap: 2,
    transition: 'all 0.15s ease',
    color: '#f5e6c8',
  },
  optBtnSelected: {
    border: '0.5px solid #d4a94a',
    background: 'rgba(212,169,74,0.08)',
  },
  optEmoji: { fontSize: 18, marginBottom: 2 },
  optMain: { fontSize: 13, fontWeight: 500, lineHeight: 1.3 },
  optSub: { fontSize: 11, color: 'rgba(245,230,200,0.4)', fontWeight: 300 },
  navRow: {
    display: 'flex',
    gap: 8,
    alignItems: 'center',
  },
  nextBtn: {
    flex: 1,
    padding: '11px 16px',
    background: '#d4a94a',
    color: '#1a1108',
    border: 'none',
    borderRadius: 10,
    fontSize: 14,
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'opacity 0.15s',
  },
  backBtn: {
    padding: '11px 14px',
    background: 'transparent',
    color: 'rgba(245,230,200,0.5)',
    border: '0.5px solid rgba(255,255,255,0.08)',
    borderRadius: 10,
    fontSize: 14,
    cursor: 'pointer',
  },
  loadingArea: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '48px 28px',
    gap: 12,
  },
  spinner: {
    width: 28,
    height: 28,
    border: '2px solid rgba(255,255,255,0.08)',
    borderTopColor: '#d4a94a',
    borderRadius: '50%',
    animation: 'spin 0.8s linear infinite',
  },
  loadingText: {
    fontSize: 14,
    color: 'rgba(245,230,200,0.5)',
    textAlign: 'center',
  },
  resultArea: {
    padding: '24px 28px',
    animation: 'fadeIn 0.4s ease',
  },
  recoCard: {
    background: '#1a1108',
    borderRadius: 12,
    padding: '20px',
    marginBottom: 16,
    border: '0.5px solid rgba(212,169,74,0.2)',
  },
  posterRow: {
    display: 'flex',
    gap: 14,
    marginBottom: 12,
  },
  poster: {
    width: 80,
    borderRadius: 8,
    objectFit: 'cover',
    flexShrink: 0,
    alignSelf: 'flex-start',
  },
  posterMeta: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
  },
  recoBadge: {
    display: 'inline-block',
    fontSize: 10,
    fontWeight: 600,
    padding: '2px 8px',
    borderRadius: 100,
    background: 'rgba(212,169,74,0.15)',
    color: '#d4a94a',
    letterSpacing: '0.06em',
    textTransform: 'uppercase',
    alignSelf: 'flex-start',
  },
  recoTitle: {
    fontFamily: "'Playfair Display', serif",
    fontSize: 18,
    color: '#f5e6c8',
    fontStyle: 'italic',
    lineHeight: 1.3,
    fontWeight: 400,
  },
  recoHeaderNoPoster: {
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 6,
  },
  recoSubMeta: {
    fontSize: 12,
    color: 'rgba(245,230,200,0.35)',
  },
  streamBadge: {
    display: 'inline-block',
    fontSize: 11,
    padding: '2px 8px',
    borderRadius: 6,
    background: 'rgba(100,200,100,0.1)',
    color: '#80d080',
    marginTop: 2,
    alignSelf: 'flex-start',
  },
  recoWhy: {
    fontSize: 13,
    color: 'rgba(245,230,200,0.7)',
    lineHeight: 1.65,
    marginTop: 4,
  },
  recoOverview: {
    fontSize: 12,
    color: 'rgba(245,230,200,0.35)',
    lineHeight: 1.6,
    marginTop: 8,
    fontStyle: 'italic',
  },
  altLabel: {
    fontSize: 11,
    fontWeight: 500,
    color: 'rgba(245,230,200,0.3)',
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
    marginBottom: 8,
  },
  altList: {
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
    marginBottom: 16,
  },
  altItem: {
    background: 'rgba(255,255,255,0.03)',
    border: '0.5px solid rgba(255,255,255,0.07)',
    borderRadius: 10,
    padding: '10px 12px',
    display: 'flex',
    gap: 10,
    alignItems: 'flex-start',
  },
  altPoster: {
    width: 36,
    borderRadius: 4,
    objectFit: 'cover',
    flexShrink: 0,
  },
  altTitle: {
    fontSize: 13,
    fontWeight: 500,
    color: '#f5e6c8',
  },
  altType: {
    fontSize: 11,
    color: 'rgba(245,230,200,0.3)',
  },
  altStreamBadge: {
    fontSize: 11,
    color: '#80d080',
  },
  altWhy: {
    fontSize: 12,
    color: 'rgba(245,230,200,0.5)',
    lineHeight: 1.5,
    marginTop: 2,
  },
  restartBtn: {
    width: '100%',
    padding: '10px',
    background: 'transparent',
    color: 'rgba(245,230,200,0.4)',
    border: '0.5px solid rgba(255,255,255,0.08)',
    borderRadius: 10,
    fontSize: 13,
    cursor: 'pointer',
  },
  errorBox: {
    background: 'rgba(255,80,80,0.06)',
    border: '0.5px solid rgba(255,80,80,0.2)',
    borderRadius: 10,
    padding: '14px 16px',
    marginBottom: 12,
  },
  errorTitle: {
    fontSize: 14,
    fontWeight: 500,
    color: '#f5e6c8',
    marginBottom: 4,
  },
  errorDetail: {
    fontSize: 12,
    color: 'rgba(245,230,200,0.4)',
    fontFamily: 'monospace',
    wordBreak: 'break-all',
    lineHeight: 1.5,
  },
  footer: {
    marginTop: 16,
    fontSize: 12,
    color: 'rgba(245,230,200,0.2)',
  },
};
