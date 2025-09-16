import React, {
  useEffect,
  useState,
  useMemo,
  useCallback,
  useContext,
  useRef,
} from "react";
import axios from "axios";
import moment from "moment"; // Assuming you're using moment.js for date formatting
import {
  dateDiffInDays,
  getAnnotationToOrtho,
  sortDatesAscending,
  ymdFormat,
} from "../../utils/Functions";
import { AnnotationsContext } from "../../context/Annotations";
import { useOrthoContext } from "../../context/OrthoContext";
import { useMap } from "../../context/Map";
import { api } from "../../config";
import { updateGeoTIFFLayer } from "../../utils/map";
import { Link, useNavigate, useParams } from "react-router-dom";
import orthoMockImage from "../../assets/location.png";
import { useEditOptions } from "../../context/editOptionsDetails";
import "../../styles/SecondNav.css";

const SecondNav = ({ dates }) => {
  const [list, setList] = useState([]);
  const { setEditOptions, editOptions } = useEditOptions();

  const [selectedItem, setSelectedItem] = useState(null);
  const [sortedDates, setSortedDates] = useState([]);
  const { ortho, setProjectDate, projectDate } = useOrthoContext();
  const [width, setWidth] = useState(5);
  const params = useParams();
  const [scale, setScale] = useState(2);
  const { updateAnnotation, annotations, staticAnnotations } =
    useContext(AnnotationsContext);
  const scrollRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);
  const [curr, setCurr] = useState(false);
  const { map, source } = useMap();
  const navigate = useNavigate();
  const fetchData = async () => {
    try {
      if (dates) setSortedDates(sortDatesAscending(dates));
      else setSortedDates([]);
    } catch (error) {
      console.error("Error fetching data", error);
    }
  };
  useEffect(() => {
    fetchData();
  }, [dates]);

  const today = new Date();
  const oneYearAgo = new Date(today.setFullYear(today.getFullYear() - 1));

  const formattedDates = useMemo(() => ymdFormat(sortedDates), [sortedDates]);
  const differenceInDays = useMemo(() => {
    return sortedDates.length > 0
      ? dateDiffInDays(sortedDates[0], new Date())
      : 0;
  }, [sortedDates]);

  const handleItemClick = (listItem, sDate) => {
    setSelectedItem(listItem);
    if (ortho.length <= 0) return;
    source.clear();
    // for (let id of staticAnnotations) {
    //   const element = document.querySelector(`[staticId=${id}]`);
    //   if (element) element.remove();
    // }
    map
      ?.getLayers()
      ?.getArray()
      ?.forEach((layer) => {
        if (!["mapLayer", "mapTiler"].includes(layer.get("id"))) {
          map.removeLayer(layer);
        }
      });

    // find the right ortho
    ortho.map(async (e) => {
      // if click the slected list item then it should return saving the fetch request
      if (moment(e.date).format("YYYY-MM-DD") != sDate) return;
      if (localStorage.getItem("orthoId") == e._id) return;
      navigate(`/project/${params.id}/${e._id}`);
      setProjectDate(moment(e?.date).format("YYYY-MM-DD"));
    });
    window.location.reload();
  };

  const daysArray = Array.from(
    { length: differenceInDays + 1 },
    (_, index) => differenceInDays - index
  );

  // wheel scroll in1 and scroll out functionality
  const weelHandler = (event) => {
    const delta = Math.sign(event.deltaY);
    const reversedDelta = -delta; // Invert the direction of scroll
    const newScale = scale + reversedDelta;
    const newSCale2 = Math.max(0.1, Math.min(newScale, 500)); // Adjust the maximum scale as needed
    setScale(newSCale2);
    setWidth(newSCale2);
  };

  const handleMouseDown = (e) => {
    const element = scrollRef.current;
    setIsDragging(true);
    setStartX(e.pageX - element.offsetLeft);
    setScrollLeft(element.scrollLeft);
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    e.preventDefault(); // Prevent default behavior to avoid text selection or other issues
    const element = scrollRef.current;
    const x = e.pageX - element.offsetLeft;
    const walk = (x - startX) * 1.5; // Adjust the multiplier for speed
    element.scrollLeft = scrollLeft - walk;
  };

  const handleMouseUpOrLeave = () => {
    setIsDragging(false);
  };
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollLeft = scrollRef.current.scrollWidth;
    }
  }, [sortedDates]);
  useEffect(() => {
    const isCurrentDatePresent = daysArray.some((d) => {
      const currentDate = moment(
        new Date(Date.now() - d * 24 * 60 * 60 * 1000)
      ).format("YYYY-MM-DD");
      return currentDate === projectDate;
    });
    setCurr(isCurrentDatePresent);
  }, [projectDate, daysArray]);

  const getImageByDate = (date) => {
    const image = [];
    ortho.map(async (e) => {
      // if click the slected list item then it should return saving the fetch request
      if (moment(e.date).format("YYYY-MM-DD") != date) return;
      if (e?.images?.length <= 0) return;
      return image.push(e?.images[0]);
    });
    return image[0] ?? orthoMockImage;
  };
  return (
    <div className="second-nav-container" onWheel={weelHandler}>
      <div
        className="date-list-container"
        id="layer-list"
        ref={scrollRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUpOrLeave}
        onMouseLeave={handleMouseUpOrLeave}
      >
        {daysArray.map((d) => {
          const currentDate = moment(
            new Date(Date.now() - d * 24 * 60 * 60 * 1000)
          ).format("YYYY-MM-DD");

          const isDateInList = formattedDates.includes(currentDate);
          const isLastDate =
            formattedDates[formattedDates.length - 1] === currentDate;
          const isIteminLastArrayAndselectNull =
            isLastDate && selectedItem == null && !curr;
          const isSelected =
            selectedItem === d ||
            projectDate === currentDate ||
            (formattedDates[formattedDates.length - 1] === currentDate &&
              selectedItem == null &&
              !curr);
          return isDateInList ? (
            <div
              key={d}
              className={`date-card ${isSelected ? "selected" : ""}`}
              onClick={() => handleItemClick(d, currentDate)}
            >
              <div className="date-card-visual">
                <div className="date-card-thumbnail">
                  {/* <img src={getImageByDate(currentDate)} alt={currentDate} /> */}
                </div>
                <div className="date-card-label">
                  <p>{currentDate}</p>
                </div>
              </div>
            </div>
          ) : (
            <div
              key={d} // Add key for proper list rendering
              className="date-tick"
              style={{
                width: `${width}px`,
              }}
            />
          );
        })}
      </div>
      <div className="compare-section">
        <Link
          to={`/compare/${params.id}/${ortho[0]?._id}/${
            ortho[ortho.length - 1]?._id
          }`}
          className="compare-button"
        >
          <svg
            width="100%"
            height="100%"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
            fit=""
            preserveAspectRatio="xMidYMid meet"
            focusable="false"
          >
            <path
              d="m20 4.01-5-.003V6h5v12h-5v2h5a2.006 2.006 0 0 0 2-2V6a1.997 1.997 0 0 0-2-1.99Z"
              // fill="#ffffff"
            ></path>
            <path
              d="m4 18 5-7V4.003L4 4a2.006 2.006 0 0 0-2 2v12a2.006 2.006 0 0 0 2 2h5v-2H4Z"
              // fill="#ffffff"
            ></path>
            <path
              d="M13 21h-2v2h2v-2Z"
              // fill="#ffffff"
            ></path>
            <path
              d="M13 20h-2v1h2v-1Z"
              //  fill="#ffffff"
            ></path>
            <path
              d="M13 2h-2v2.005h2V2Z"
              // fill="#ffffff"
            ></path>
            <path
              d="M13 4.005h-2V20h2V4.005Z"
              // fill="#ffffff"
            ></path>
            <path
              d="M15 18h5l-5-7v7Z"
              //  fill="#ffffff"
            ></path>
          </svg>
          <span>Compare</span>
        </Link>
      </div>
    </div>
  );
};

export default SecondNav;
