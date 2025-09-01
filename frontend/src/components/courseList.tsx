import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import "../css/Courses.css";
import config from "../config";


export default function CourseList() {
 
const [lod,setLod] = useState('hey')
    const [posts, setPosts] = useState<object[]>([]);
const createCourse = async () => {
  setLod('yes')
  try {
    const res = await fetch(`${config.BACKEND_URL}/api/courses/`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });

    if (!res.ok) {
      throw new Error("Failed to fetch courses");
    }

    const data = await res.json();
   // alert(JSON.stringify(data))
if (Array.isArray(data.courses)) {
  setPosts(data.courses);  // Use the courses array
} else {
  console.error("Expected an array but got:", data);
  setPosts([]); // fallback to empty array to avoid crashes
}
    setLod('no')
    // fetchCourses(); // Uncomment if needed to refresh separately
  } catch (error) {
    console.error("Error fetching courses:", error);
  }
};
useEffect(()=>{
  createCourse()
},[])
 const joinCourse = async (id: string) => {
  try {
    const res = await fetch(`${config.BACKEND_URL}/api/courses/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ courseId: id }),
    });

    if (!res.ok) {
      throw new Error(`Failed to join course with id: ${id}`);
    }

    const data = await res.json(); // Optional: handle the response data
    alert(`Joined course:${data}`);

    // fetchCourses(); // Uncomment if you want to refresh the list after joining
  } catch (error) {
    console.error("Error joining course:", error);
  }
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
        <h2 className="section-title">My Courses</h2>
        <div className="course-grid">
          {lod==='no' ? posts.map(course => {
            const c = course as { id: string; title: string };
            return(

            <div key={c.id} className="course-card">
              <p>{c.title}</p>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
               
                <button className="leave-btn">
                   <Link to={`/course/${c.id}`} style={{ color: "white", fontWeight: "bold" }}>
                  View course
                </Link>
                </button>
                 <button className="join-btn" onClick={() => joinCourse(c.id)}>
                Join Course
              </button>
              </div>
            </div>
          )}):(<p>helloooooo</p>)}
        </div>
      </section>

      {/* Unjoined Courses */}
      <section>
       
      </section>
    </div>
  );
}
