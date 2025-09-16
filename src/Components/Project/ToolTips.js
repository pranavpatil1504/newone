import React, { useEffect, useState } from "react";

const ToolTips = ({ setDrawType, width }) => {
  const [id, setId] = useState("");
  const [divRigth, setDivRight] = useState(21);
  const list = [
    // {
    //   id: "cursor",
    //   icon: (
    //     <svg
    //       width="100%"
    //       height="100%"
    //       viewBox="0 0 24 24"
    //       xmlns="http://www.w3.org/2000/svg"
    //       fit=""
    //       preserveAspectRatio="xMidYMid meet"
    //       focusable="false"
    //       className="map-drawing-icon"
    //     >
    //       <path
    //         d="M9.07 14.03a.997.997 0 0 1 1.33.48l2.3 4.99 1.8-.85-2.31-4.98a.993.993 0 0 1 .48-1.33l.28-.08 2.3-.45L7 4.88v10.78l1.82-1.47.25-.16Zm3.57 7.7a.99.99 0 0 1-1.33-.47l-2.18-4.74-2.51 2.02a.957.957 0 0 1-.62.22 1 1 0 0 1-1-1v-15a1 1 0 0 1 1.64-.77l.01-.01 11.49 9.64a1 1 0 0 1-.44 1.75l-3.16.62 2.2 4.73a.967.967 0 0 1-.48 1.32l-3.62 1.69Z"
    //         fill="#FFFFFF"
    //       ></path>
    //     </svg>
    //   ),
    //   type: "Cursor",
    // },
    {
      id: "cursor",
      icon: (
        <svg
          width="100%"
          height="100%"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
          fit=""
          preserveAspectRatio="xMidYMid meet"
          focusable="false"
          className="map-drawing-icon"
        >
          <path
            d="M9.07 14.03a.997.997 0 0 1 1.33.48l2.3 4.99 1.8-.85-2.31-4.98a.993.993 0 0 1 .48-1.33l.28-.08 2.3-.45L7 4.88v10.78l1.82-1.47.25-.16Zm3.57 7.7a.99.99 0 0 1-1.33-.47l-2.18-4.74-2.51 2.02a.957.957 0 0 1-.62.22 1 1 0 0 1-1-1v-15a1 1 0 0 1 1.64-.77l.01-.01 11.49 9.64a1 1 0 0 1-.44 1.75l-3.16.62 2.2 4.73a.967.967 0 0 1-.48 1.32l-3.62 1.69Z"
            fill="#ffffff"
          ></path>
        </svg>
      ),
      type: "Cursor",
    },
    {
      id: "lineBtn",
      icon: (
        <svg
          width="100%"
          height="100%"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
          fit=""
          preserveAspectRatio="xMidYMid meet"
          focusable="false"
          className="map-drawing-icon"
        >
          <path
            d="M19 2a3.003 3.003 0 0 0-3 3c.003.458.112.91.319 1.319l-.026-.026-10 10 .026.026A2.962 2.962 0 0 0 5 16a3 3 0 1 0 3 3 2.963 2.963 0 0 0-.319-1.319l.026.026 10-10-.026-.026c.41.207.86.316 1.319.319a3 3 0 1 0 0-6ZM5 20a1 1 0 1 1 0-2 1 1 0 0 1 0 2ZM19 6a1 1 0 1 1 0-2 1 1 0 0 1 0 2Z"
            fill="#ffffff"
          ></path>
        </svg>
      ),
      type: "LineString", // Draw Line
    },
    {
      id: "areaBtn",
      icon: (
        <svg
          width="100%"
          height="100%"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
          fit=""
          preserveAspectRatio="xMidYMid meet"
          className="map-drawing-icon"
          focusable="false"
        >
          <path
            d="M20 16.184V7.816A2.992 2.992 0 1 0 16.184 4H7.816A2.993 2.993 0 1 0 4 7.816v8.368A2.992 2.992 0 1 0 7.816 20h8.368A2.993 2.993 0 1 0 20 16.184ZM16.184 18H7.816A2.995 2.995 0 0 0 6 16.184V7.816A2.996 2.996 0 0 0 7.816 6h8.368A2.997 2.997 0 0 0 18 7.816v8.368A2.996 2.996 0 0 0 16.184 18ZM19 4a1 1 0 1 1 0 2 1 1 0 0 1 0-2ZM5 4a1 1 0 1 1 0 2 1 1 0 0 1 0-2Zm0 16a1 1 0 1 1 0-2 1 1 0 0 1 0 2Zm14 0a1 1 0 1 1 0-2 1 1 0 0 1 0 2Z"
            fill="#ffffff"
          ></path>
        </svg>
      ),
      type: "Polygon", // Draw Polygon
    },
    {
      id: "locate",
      icon: (
        <svg
          width="100%"
          height="100%"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
          fit=""
          preserveAspectRatio="xMidYMid meet"
          focusable="false"
          className="map-drawing-icon"
        >
          <path
            d="M12 2a6.995 6.995 0 0 0-7 7c0 5.25 7 13 7 13s7-7.75 7-13a6.993 6.993 0 0 0-7-7Zm0 9.5a2.5 2.5 0 1 1 0-5 2.5 2.5 0 0 1 0 5Z"
            fill="#ffffff"
          ></path>
        </svg>
      ),
      type: "Point", // Draw Point
    },
  ];

  const onClickHandler = (ID, drawType) => {
    setId(ID);
    setDrawType(drawType); // Set the draw type on map
  };
  // useEffect(() => {
  //   setDrawType("Cursor");
  // }, []);
  useEffect(() => {
    setDivRight(parseFloat(width));
  }, [width]);

  return (
    <div className="tool-tip" style={{ right: `${divRigth}%` }}>
      {list.map((e) => (
        <button
          key={e.id}
          id={e.id}
          onClick={() => onClickHandler(e.id, e.type)}
          style={{
            background: id === e.id ? "#38536d" : "transparent",
          }}
        >
          {/* <i className={e.icon}></i> */}
          {e.icon}
        </button>
      ))}
    </div>
  );
};

export default ToolTips;
