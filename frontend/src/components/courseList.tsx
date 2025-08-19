import { useState } from "react";
import { Link } from "react-router-dom";
import "../css/Courses.css";
type Course = {
  id: number;
  name: string;
  code: string;
};

export default function CourseList() {
  const [joined, setJoined] = useState<Course[]>([
    { id: 1, name: "Mechanics II - FYR - 2025", code: "APPM2023A" },
    { id: 2, name: "Learning Zulu - Beginner", code: "ZULU101" },
  ]);

  const [unjoined, setUnjoined] = useState<Course[]>([
    { id: 3, name: "Numerical Methods", code: "MATH3021" },
    { id: 4, name: "Data Structures & Algorithms", code: "CS2045" },
  ]);

  const joinCourse = (course: Course) => {
    setJoined([...joined, course]);
    setUnjoined(unjoined.filter(c => c.id !== course.id));
  };

//  const leaveCourse = (course: Course) => {
   // setUnjoined([...unjoined, course]);
    //setJoined(joined.filter(c => c.id !== course.id));
  //};

  return (
    <div className="courses-container">
        <div style={{ display: "flex", justifyContent: "space-between" }}>
<h1 className="title">My Courses</h1>
<button className="leave-btn">
                   <Link to={'/create'} style={{ color: "purple", fontWeight: "bold" }}>
                  Create course
                </Link>
                </button>
        </div>
      

      {/* Joined Courses */}
      <section>
        <h2 className="section-title">Joined Courses</h2>
        <div className="course-grid">
          {joined.map(course => (
            <div key={course.id} className="course-card">
              <h3>{course.code}</h3>
              <p>{course.name}</p>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
               
                <button className="leave-btn">
                   <Link to={`/course/${course.id}`} style={{ color: "white", fontWeight: "bold" }}>
                  View course
                </Link>
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Unjoined Courses */}
      <section>
        <h2 className="section-title">Unjoined Courses</h2>
        <div className="course-grid">
          {unjoined.map(course => (
            <div key={course.id} className="course-card">
              <h3>{course.code}</h3>
              <p>{course.name}</p>
              <button className="join-btn" onClick={() => joinCourse(course)}>
                Join Course
              </button>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
