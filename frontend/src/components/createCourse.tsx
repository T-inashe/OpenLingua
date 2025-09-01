import { useState } from "react";
import config from "../config";
import "../css/CreateCourse.css";
type Word = {
  term: string;
  meaning: string;
  usage: string;
};

export default function CreateCourse() {
  const [title, setName] = useState("");
  const [code, setCode] = useState("");
  const [description, setDescription] = useState("");
  const [language, setLanguage] = useState("");
  const [level, setLevel] = useState("Beginner");

  const [words, setWords] = useState<Word[]>([]);
  const [wordZulu, setWordZulu] = useState("");
  const [wordEnglish, setWordEnglish] = useState("");
  const [wordUsage, setWordUsage] = useState("");

 

  const addWord = () => {
    if (!wordZulu || !wordEnglish) return;
    setWords([...words, { term: wordZulu, meaning: wordEnglish, usage: wordUsage }]);
    setWordZulu("");
    setWordEnglish("");
    setWordUsage("");
  };


  const createCourse = async () => {
      if (!title || !code || !description) {
      alert("Please fill in all required fields.");
      return;
    }
  await fetch(`${config.BACKEND_URL}/api/courses/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      title: title,
      code: code,
      description: description,
      words: words,
    }),
  });
//  fetchCourses(); // refresh
 
};

  return (
    <div className="create-course" style={{ padding: "1.5rem" }}>
      <h1 style={{ color: "purple" }}>Create a New Language Course</h1>

      <div style={{ marginBottom: "1rem" }}>
        <label>Course Name *</label>
        <input
          value={title}
          onChange={(e) => setName(e.target.value)}
          style={{ display: "block", width: "100%", marginBottom: "1rem" }}
        />

        <label>Course Code *</label>
        <input
          value={code}
          onChange={(e) => setCode(e.target.value)}
          style={{ display: "block", width: "100%", marginBottom: "1rem" }}
        />

        <label>Description *</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          style={{ display: "block", width: "100%", marginBottom: "1rem" }}
        />

        <label>Language *</label>
        <input
          value={language}
          onChange={(e) => setLanguage(e.target.value)}
          placeholder="e.g. Zulu"
          style={{ display: "block", width: "100%", marginBottom: "1rem" }}
        />

        <label>Level *</label>
        <select value={level} onChange={(e) => setLevel(e.target.value)}>
          <option>Beginner</option>
          <option>Intermediate</option>
          <option>Advanced</option>
        </select>
      </div>

      {/* Word List Section */}
      <h2>📚 Add Vocabulary Words</h2>
      <div style={{ marginBottom: "1rem" }}>
        <input
          value={wordZulu}
          onChange={(e) => setWordZulu(e.target.value)}
          placeholder="Zulu Word"
          style={{ marginRight: "0.5rem" }}
        />
        <input
          value={wordEnglish}
          onChange={(e) => setWordEnglish(e.target.value)}
          placeholder="English Translation"
          style={{ marginRight: "0.5rem" }}
        />
        <input
          value={wordUsage}
          onChange={(e) => setWordUsage(e.target.value)}
          placeholder="Usage Example"
          style={{ marginRight: "0.5rem" }}
        />
        <button onClick={addWord} className="join-btn">Add Word</button>
      </div>

      <ul>
        {words.map((w, i) => (
          <li key={i}>
            <strong>{w.term}</strong> = {w.meaning} <em>({w.usage})</em>
          </li>
        ))}
      </ul>

      <button onClick={createCourse} className="join-btn" style={{ marginTop: "1rem" }}>
        Save Course
      </button>
    </div>
  );
}
