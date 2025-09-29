import { Loader2, Search } from "lucide-react";

interface TranslatorSectionProps {
  input: string;
  sourceLang: string;
  targetLang: string;
  loading: boolean;
  translation: string;
  isValid: boolean;
  onChangeInput: (v: string) => void;
  onChangeSource: (v: string) => void;
  onChangeTarget: (v: string) => void;
  onTranslate: () => void;
}

export default function TranslatorSection({
  input,
  sourceLang,
  targetLang,
  loading,
  translation,
  isValid,
  onChangeInput,
  onChangeSource,
  onChangeTarget,
  onTranslate,
}: TranslatorSectionProps) {
  return (
    <section
      className={`bg-white/5 backdrop-blur-lg rounded-xl p-6 border border-white/10 mb-8`}
      role="region"
      aria-labelledby="translator-heading"
    >
      <h2 id="translator-heading" className="text-white font-semibold text-xl mb-4 flex items-center gap-2">
        <Search size={20} className="text-cyan-400" aria-hidden="true" /> Language Translator
      </h2>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          onTranslate();
        }}
        className="space-y-4"
      >
        <div className="flex flex-col gap-3 md:flex-row md:items-center">
          <div className="flex-1 relative">
            <input
              type="text"
              value={input}
              placeholder="Enter text to translate"
              onChange={(e) => onChangeInput(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-transparent transition-all duration-200"
              aria-label="Text to translate"
              aria-describedby={!isValid ? "translation-error" : undefined}
            />
            {!isValid && input.length > 0 && (
              <p id="translation-error" className="text-red-400 text-sm mt-1" role="alert">
                Please enter text to translate
              </p>
            )}
          </div>
          <div className="flex gap-2 flex-wrap">
            <div className="flex flex-col">
              <label htmlFor="source-lang" className="text-white text-sm mb-1">
                From:
              </label>
              <select
                id="source-lang"
                value={sourceLang}
                onChange={(e) => onChangeSource(e.target.value)}
                className="bg-white/5 text-white border border-white/10 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-cyan-400 min-w-[100px]"
                aria-label="Source language"
              >
                <option value="auto">Auto</option>
                <option value="en">English</option>
                <option value="zu">Zulu</option>
                <option value="es">Spanish</option>
                <option value="fr">French</option>
              </select>
            </div>
            <div className="flex flex-col">
              <label htmlFor="target-lang" className="text-white text-sm mb-1">
                To:
              </label>
              <select
                id="target-lang"
                value={targetLang}
                onChange={(e) => onChangeTarget(e.target.value)}
                className="bg-white/5 text-white border border-white/10 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-cyan-400 min-w-[100px]"
                aria-label="Target language"
              >
                <option value="en">English</option>
                <option value="zu">Zulu</option>
                <option value="es">Spanish</option>
                <option value="fr">French</option>
              </select>
            </div>
          </div>
          <button
            type="submit"
            disabled={loading || !isValid}
            className="bg-gradient-to-r from-cyan-500 to-purple-500 text-white px-6 py-2 rounded-lg flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed hover:from-cyan-600 hover:to-purple-600 focus:outline-none focus:ring-2 focus:ring-cyan-400 transition-all duration-200 min-w-[120px]"
            aria-label="Translate text"
          >
            {loading ? <Loader2 size={18} className="animate-spin" aria-hidden="true" /> : "Translate"}
          </button>
        </div>
      </form>
      {translation && !loading && (
        <div className="mt-4 p-4 bg-white/5 rounded-lg border border-cyan-500/30" role="region" aria-live="polite">
          <h3 className="text-cyan-300 font-medium text-sm mb-2">Translation:</h3>
          <p className="text-cyan-300 font-medium">{translation}</p>
        </div>
      )}
    </section>
  );
}
