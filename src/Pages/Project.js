import React, { useState, useEffect, useContext } from "react";
import Nav from "../Components/Nav";
import DropIt from "../Components/Project/DropIt";
import Main from "../Components/Project/Main";
import BottomNav from "../Components/Project/BottomNav";
import SecondNav from "../Components/Project/SecondNav";
import "../styles/Home.css";
import axios from "axios";
import { api } from "../config";
import { useParams, useLocation } from "react-router-dom";
import { AnnotationsContext } from "../context/Annotations";
import { useOrthoContext } from "../context/OrthoContext";
import moment from "moment";
import { getAnnotationToOrtho, sortDatesAscending } from "../utils/Functions";
import LoadingSpinner from "../Components/LoadingSpinner";

import ProjectVideosPage from "./ProjectVideosPage";
import ProjectPhotosPage from "./ProjectPhotosPage";
import ProjectPanoPage from "./ProjectPanoPage";

const Project = () => {
  const params = useParams();
  const location = useLocation();
  const { updateAnnotation } = useContext(AnnotationsContext);
  const { setOrtho, setUrl, setProjectDate } = useOrthoContext();
  const [name, setName] = useState("");
  const [dates, setDates] = useState();
  const [secondNavVisible, setSecondNavVisible] = useState(true);
  const [isLoading, setIsLoading] = useState(true);

  const toggleSecondNav = () => {
    setSecondNavVisible(!secondNavVisible);
  };

  useEffect(() => {
    const fetchData = async () => {
      if (!params.id) return;
      setIsLoading(true);
      try {
        const { data } = await axios.get(
          `${api}/arthouses/project/${params.id}`
        );
        if (!data?.length) {
          setIsLoading(false);
          return;
        }
        setOrtho(data);
        const projectDates = data.map((item) => item.date);
        setDates(sortDatesAscending(projectDates));

        const primaryOrthoId = params.orthoId || data[0]?._id;
        if (primaryOrthoId) {
          const annot = await getAnnotationToOrtho(primaryOrthoId);
          if (annot) {
            updateAnnotation(annot.annotations);
            localStorage.setItem("orthoId", annot._id);
            localStorage.setItem("projectId", annot.ProjectId._id);
            setUrl(annot.images[0] || "");
            setName(annot?.ProjectId?.name);
            setProjectDate(moment(annot?.date).format("YYYY-MM-DD"));
          }
        }
      } catch (error) {
        console.error("Error fetching data", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [params.id, params.orthoId]);

  if (isLoading) {
    return <LoadingSpinner message="Loading Project..." />;
  }

  const isVideosView = location.pathname.includes("/videos");
  const isPhotosView = location.pathname.includes("/photos");
  const isPanoView = location.pathname.includes("/pano");
  const isMediaView = isVideosView || isPhotosView || isPanoView;

  return (
    <div id="view-gis">
      <DropIt />
      <Nav name={name} onProject={true} />

      {!isMediaView && secondNavVisible && <SecondNav dates={dates} />}

      <div className="page-content-wrapper">
        {isVideosView ? (
          <ProjectVideosPage />
        ) : isPhotosView ? (
          <ProjectPhotosPage />
        ) : isPanoView ? (
          <ProjectPanoPage />
        ) : (
          <Main
            secondNavVisible={secondNavVisible}
            toggleSecondNav={toggleSecondNav}
          />
        )}
      </div>

      {!isMediaView && <BottomNav />}
    </div>
  );
};

export default Project;
