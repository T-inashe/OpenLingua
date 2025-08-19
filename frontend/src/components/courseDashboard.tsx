import { useParams } from "react-router-dom";
import { useState } from "react";
import "../css/CourseDashboard.css";
type Word = {
  zulu: string;
  english: string;
  usage: string;
};

export default function CourseDashboard() {
  const { id } = useParams();
  
  // Example words for Zulu course
  const words: Word[] = [
    { zulu: "Sawubona", english: "Hello", usage: "Used as a greeting" },
    { zulu: "Ngiyabonga", english: "Thank you", usage: "To express gratitude" },
    { zulu: "Yebo", english: "Yes", usage: "Affirmative response" },
    { zulu: "Cha", english: "No", usage: "Negative response" },
  ];

  const [input, setInput] = useState("");
  const [translation, setTranslation] = useState("");

  const [forum, setForum] = useState<string[]>([]);
  const [message, setMessage] = useState("");

  const translate = () => {
    const found = words.find(
      w => w.zulu.toLowerCase() === input.toLowerCase() || w.english.toLowerCase() === input.toLowerCase()
    );
    setTranslation(found ? `${found.zulu} ↔ ${found.english}` : "Not found");
  };

  const postMessage = () => {
    if (message.trim()) {
      setForum([message, ...forum]);
      setMessage("");
    }
  };

  return (
    <div className="" style={{ padding: "1.5rem" }}>
      <h1 className="course-header" style={{ color: "purple" }}>Course Details (ID: {id})</h1>

      {/* Translator */}
      <section className="course-details">
        <h2>🔤 Zulu ↔ English Translator</h2>
        <input
          type="text"
          value={input}
          placeholder="Enter Zulu or English word"
          onChange={(e) => setInput(e.target.value)}
          style={{ padding: "0.5rem", marginRight: "0.5rem" }}
        />
        <button onClick={translate} className="join-btn">Translate</button>
        <p style={{ marginTop: "0.5rem", fontWeight: "bold" }}>{translation}</p>
      </section>

      {/* Library */}
      <section className="library">
        <h2>📚 Word Library</h2>
        <ul>
          {words.map((w, i) => (
            <li key={i}>
              <strong>{w.zulu}</strong> = {w.english} <em>({w.usage})</em>
            </li>
          ))}
        </ul>
      </section>

      {/* Forum */}
      <section className="forum">
        <h2>💬 Forum Discussion</h2>
        <textarea
          rows={3}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Write your message..."
          style={{ width: "100%", padding: "0.5rem" }}
        />
        <button onClick={postMessage} className="join-btn" style={{ marginTop: "0.5rem" }}>
          Post
        </button>

        <div style={{ marginTop: "1rem" }}>
          {forum.map((msg, i) => (
            <div key={i} style={{ background: "#f3e5f5", padding: "0.5rem", marginBottom: "0.5rem", borderRadius: "6px" }}>
              {msg}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
