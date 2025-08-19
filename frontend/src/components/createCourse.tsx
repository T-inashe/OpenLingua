import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../css/CreateCourse.css";
type Word = {
  zulu: string;
  english: string;
  usage: string;
};

export default function CreateCourse() {
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [description, setDescription] = useState("");
  const [language, setLanguage] = useState("");
  const [level, setLevel] = useState("Beginner");

  const [words, setWords] = useState<Word[]>([]);
  const [wordZulu, setWordZulu] = useState("");
  const [wordEnglish, setWordEnglish] = useState("");
  const [wordUsage, setWordUsage] = useState("");

  const navigate = useNavigate();

  const addWord = () => {
    if (!wordZulu || !wordEnglish) return;
    setWords([...words, { zulu: wordZulu, english: wordEnglish, usage: wordUsage }]);
    setWordZulu("");
    setWordEnglish("");
    setWordUsage("");
  };

  const saveCourse = () => {
    if (!name || !code || !description || !language) {
      alert("Please fill in all required fields.");
      return;
    }

    const newCourse = {
      id: Date.now(),
      name,
      code,
      description,
      language,
      level,
      words,
    };

    // Save to localStorage
    const saved = localStorage.getItem("courses");
    const courses = saved ? JSON.parse(saved) : [];
    courses.push(newCourse);
    localStorage.setItem("courses", JSON.stringify(courses));

    alert("Course created successfully!");
    navigate("/");
  };

  return (
    <div className="create-course" style={{ padding: "1.5rem" }}>
      <h1 style={{ color: "purple" }}>Create a New Language Course</h1>

      <div style={{ marginBottom: "1rem" }}>
        <label>Course Name *</label>
        <input
          value={name}
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
            <strong>{w.zulu}</strong> = {w.english} <em>({w.usage})</em>
          </li>
        ))}
      </ul>

      <button onClick={saveCourse} className="join-btn" style={{ marginTop: "1rem" }}>
        Save Course
      </button>
    </div>
  );
}
