import React from "react";
import { useNavigate, useParams } from "react-router-dom";

const CompareNav = ({ setEditOptions }) => {
  const navigate = useNavigate();
  const params = useParams();
  return (
    <div className="compare-nav">
      <div className="flex align-center">
        <svg
          width="100%"
          height="100%"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
          fit=""
          preserveAspectRatio="xMidYMid meet"
          focusable="false"
          style={{ width: "26px", height: "26px", marginRight: "3px" }}
        >
          <path
            d="m20 4.01-5-.003V6h5v12h-5v2h5a2.006 2.006 0 0 0 2-2V6a1.997 1.997 0 0 0-2-1.99Z"
            fill="#ffffff"
          ></path>
          <path
            d="m4 18 5-7V4.003L4 4a2.006 2.006 0 0 0-2 2v12a2.006 2.006 0 0 0 2 2h5v-2H4Z"
            fill="#ffffff"
          ></path>
          <path d="M13 21h-2v2h2v-2Z" fill="#ffffff"></path>
          <path d="M13 20h-2v1h2v-1Z" fill="#ffffff"></path>
          <path d="M13 2h-2v2.005h2V2Z" fill="#ffffff"></path>
          <path d="M13 4.005h-2V20h2V4.005Z" fill="#ffffff"></path>
          <path d="M15 18h5l-5-7v7Z" fill="#ffffff"></path>
        </svg>
        <div
          style={{ height: "30px", width: "2px", backgroundColor: "white" }}
        ></div>
        <p>Compare mode</p>
      </div>

      <div className="flex align-center" style={{ gap: "2rem" }}>
        {/* <div>
          <p>Vertical</p>
        </div> */}
        {/* <div className="flex align-center compare-nav-sec">
          <svg
            width="100%"
            height="100%"
            viewBox="0 0 16 16"
            xmlns="http://www.w3.org/2000/svg"
            fit=""
            preserveAspectRatio="xMidYMid meet"
            focusable="false"
            style={{ width: "20px", height: "20px", marginRight: "-8px" }}
          >
            <path
              d="M11 10a2 2 0 0 0-1.43.61L5.92 8.52a1.73 1.73 0 0 0 0-1l3.65-2.13A2 2 0 0 0 11 6a2 2 0 1 0-2-2c.001.176.028.351.08.52L5.43 6.61A2 2 0 0 0 4 6a2 2 0 1 0 0 4 2 2 0 0 0 1.43-.61l3.65 2.09A1.82 1.82 0 0 0 9 12a2 2 0 1 0 2-2Z"
              fill="#ffffff"
            ></path>
          </svg>
          <p style={{ fontSize: "14px" }}>Share</p>
        </div> */}
        <div
          className="flex align-center compare-nav-sec"
          onClick={() => {
            navigate(
              `/project/${localStorage?.getItem(
                "projectId"
              )}/${localStorage?.getItem("orthoId")}`
            );
            setEditOptions();
            // window.history.back();
          }}
        >
          <svg
            width="100%"
            height="100%"
            viewBox="0 0 16 16"
            xmlns="http://www.w3.org/2000/svg"
            fit=""
            preserveAspectRatio="xMidYMid meet"
            focusable="false"
            style={{ width: "16px", height: "16px", marginRight: "-8px" }}
          >
            <path
              d="m14.21 3.21-1.42-1.42L8 6.59l-4.79-4.8-1.42 1.42L6.59 8l-4.8 4.79 1.42 1.42L8 9.41l4.79 4.8 1.42-1.42L9.41 8l4.8-4.79Z"
              fill="#ffffff"
            ></path>
          </svg>
          <p style={{ fontSize: "14px" }}>Exit Compare Mode</p>
        </div>
      </div>
    </div>
  );
};

export default CompareNav;
