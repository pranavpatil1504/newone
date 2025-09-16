import axios from "axios";
import React, { useEffect, useState } from "react";
import { api } from "../config";
import ProjectsCard from "../Components/Projects/ProjectsCard";
import "../styles/Projects.css";
import Nav from "../Components/Nav";
import { useUser } from "../context/UserContext";
import LoadingSpinner from "../Components/LoadingSpinner";

const Projects = () => {
  const [projects, setProjects] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const user = JSON.parse(localStorage.getItem("user")).user;
  const fetchProjects = async () => {
    setIsLoading(true);
    try {
      const { data } = await axios.get(`${api}projects/user/${user?._id}`);
      console.log(data, "projects");
      setProjects(data);
    } catch (error) {
      console.log(error);
    } finally {
      // +++ 3. SET LOADING TO FALSE AFTER FETCHING IS COMPLETE +++
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // The function name inside useEffect is updated
    fetchProjects();
  }, []);

  if (isLoading) {
    return <LoadingSpinner message="Loading Projects..." />;
  }

  return (
    <div className="projects-page-container">
      <Nav />
      <div className="projects-content">
        {projects.length <= 0 ? (
          <div className="no-projects-container">
            <h2 className="no-projects-title">No Projects Yet!</h2>
          </div>
        ) : (
          <div className="projects-grid">
            {projects.map((e) => (
              <ProjectsCard key={e._id} item={e} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Projects;
