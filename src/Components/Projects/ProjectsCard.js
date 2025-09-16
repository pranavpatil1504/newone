// import React from "react";
// import { useNavigate } from "react-router-dom";
// import Image from "../../assets/mumbai.jpeg";

// const ProjectsCard = ({ item }) => {
//   const navigate = useNavigate();

//   const formatDate = (dateString) => {
//     if (!dateString) return "No Date Provided";
//     try {
//       const date = new Date(dateString);
//       return date.toLocaleDateString("en-US", {
//         month: "short",
//         day: "numeric",
//         year: "numeric",
//       });
//     } catch (error) {
//       console.error("Invalid date format:", dateString);
//       return "Invalid Date";
//     }
//   };

//   const displayDate = formatDate(item.createdAt);
//   const imageUrl = item.images?.[0] || Image;

//   return (
//     <div
//       className="project-card"
//       onClick={() => {
//         if (item?._id) {
//           localStorage.setItem("projectId", item._id);
//           navigate(`/project/${item._id}/${item?.arthouse}`);

//         } else {
//           console.error("CRITICAL ERROR: Cannot navigate because project item is missing an _id.");
//         }
//       }}
//     >
//       <div className="project-card-image-wrapper">
//         <img src={imageUrl} alt={item.name} className="project-card-image" />
//         <span className="project-card-badge">Demo</span>
//       </div>

//       <div className="project-card-content">
//         <h3 className="project-card-title" title={item.name}>
//           {item.name}
//         </h3>
//         <p className="project-card-date">{displayDate}</p>
//         <button type="button" className="project-card-button">
//           Open
//         </button>
//       </div>
//     </div>
//   );
// };

// export default ProjectsCard;
import React from "react";
import { useNavigate } from "react-router-dom";
import Image from "../../assets/mumbai.jpeg";

const ProjectsCard = ({ item }) => {
  const navigate = useNavigate();

  const formatDate = (dateString) => {
    if (!dateString) return "No Date Provided";
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    } catch (error) {
      console.error("Invalid date format:", dateString);
      return "Invalid Date";
    }
  };

  const displayDate = formatDate(item.createdAt);
  const imageUrl = item.images?.[0] || Image;

  // Get the first arthouse ID or empty string if none exists
  const firstArthouseId = item.arthouses?.[0]?._id || "";

  return (
    <div
      className="project-card"
      onClick={() => {
        if (item?._id) {
          localStorage.setItem("projectId", item._id);
          navigate(`/project/${item._id}/${firstArthouseId}`);
        } else {
          console.error(
            "CRITICAL ERROR: Cannot navigate because project item is missing an _id."
          );
        }
      }}
    >
      <div className="project-card-image-wrapper">
        <img src={imageUrl} alt={item.name} className="project-card-image" />
        <span className="project-card-badge">Demo</span>
      </div>

      <div className="project-card-content">
        <h3 className="project-card-title" title={item.name}>
          {item.name}
        </h3>
        <p className="project-card-date">{displayDate}</p>
        <button type="button" className="project-card-button">
          Open
        </button>
      </div>
    </div>
  );
};

export default ProjectsCard;