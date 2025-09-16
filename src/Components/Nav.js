import React, { useContext, useState, useEffect, useRef } from "react";
import ReactDOM from "react-dom"; // Import ReactDOM for Portal
import logo from "../assets/ThinkaerialLogo.png";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useUser } from "../context/UserContext";
import { extentionScrapper } from "../utils/Functions";
import { handleKmlKmzFiles } from "../utils/File/KmlKmz/KmlKmzFile";
import { handleShpFile } from "../utils/File/ShpShz/FileHandler";
import { handleDwgDxfFiles } from "../utils/File/DXF/DXfFile";
import { useMap } from "../context/Map";
import { useEditOptions } from "../context/editOptionsDetails";
import { useOrthoContext } from "../context/OrthoContext";
import { AnnotationsContext } from "../context/Annotations";
import { FiLogOut, FiUser, FiUpload, FiGrid } from "react-icons/fi";
import "../styles/Nav.css";

const Nav = ({ name, onProject = false }) => {
  const navigate = useNavigate();
  const { map, source } = useMap();
  const { user, storeUser, logout } = useUser();
  const { setEditOptions } = useEditOptions();
  const { addStaticAnnotation, addAnnotation } = useContext(AnnotationsContext);
  const { projectDate } = useOrthoContext();
  const { orthoId } = useParams();

  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);

  // State for the "Dataset" dropdown
  const [isDatasetOpen, setIsDatasetOpen] = useState(false);

  // Ref to the "Dataset" button to get its position
  const datasetButtonRef = useRef(null);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0 });

  const { id: projectId } = useParams();

  useEffect(() => {
    // This effect calculates the correct position for the dropdown menu
    if (isDatasetOpen && datasetButtonRef.current) {
      const rect = datasetButtonRef.current.getBoundingClientRect();
      setDropdownPosition({
        top: rect.bottom + 8, // Position it 8px below the button
        left: rect.left, // Align its left edge with the button's left edge
      });
    }
  }, [isDatasetOpen]);

  useEffect(() => {
    try {
      const userString = user || localStorage.getItem("user");
      if (userString) {
        setCurrentUser(JSON.parse(userString));
      }
    } catch (error) {
      console.error("Failed to parse user data:", error);
      setCurrentUser(null);
    }
  }, [user]);

  const setEditOPtionHandler = (data) => setEditOptions(data);
  const addStaticAnnotationfunc = (data) => addStaticAnnotation(data);
  const setAnnotationFuntion = (annot) => addAnnotation(annot);

  const fileHandler = (e) => {
    for (let file of e.target.files) {
      const fileExtension = extentionScrapper(file?.name);
      switch (fileExtension) {
        case "kml":
        case "kmz":
          handleKmlKmzFiles(
            e,
            null,
            map,
            true,
            null,
            null,
            setEditOPtionHandler,
            source,
            addStaticAnnotationfunc,
            setAnnotationFuntion,
            orthoId
          );
          break;
        case "zip":
        case "shp":
          handleShpFile(
            e,
            map,
            null,
            setEditOPtionHandler,
            source,
            addStaticAnnotationfunc,
            setAnnotationFuntion,
            orthoId
          );
          break;
        case "dwg":
        case "dxf":
          handleDwgDxfFiles(
            e,
            map,
            null,
            null,
            null,
            setEditOPtionHandler,
            source,
            addStaticAnnotationfunc,
            setAnnotationFuntion,
            orthoId
          );
          break;
        default:
          console.log("Unsupported file type:", fileExtension);
      }
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("user");
    storeUser(null);
    logout();
    navigate("/");
    setShowLogoutModal(false);
  };

  return (
    <>
      <header className="navbar">
        <div className="navbar-container">
          {/* Left Side */}
          <div className="navbar-left">
            <div
              className="brand-logo"
              onClick={() => (window.location.href = "/projects")}
            >
              <img src={logo} alt="Logo" className="logo-img" />
            </div>
            {onProject && (
              <div className="project-info">
                <h4 className="project-name">{name}</h4>
                <i className="fas fa-chevron-right separator-icon"></i>
                <h4 className="project-date">{projectDate}</h4>
              </div>
            )}
          </div>

          {/* Right Side */}
          <div className="navbar-right">
            {currentUser && (
              <span className="welcome-message">
                Welcome, {currentUser.name || "User"}
              </span>
            )}

            {onProject && (
              <div className="dropdown-wrapper">
                {/* The "Dataset" button now has a ref */}
                <button
                  ref={datasetButtonRef}
                  className="nav-button"
                  onClick={() => setIsDatasetOpen(!isDatasetOpen)}
                >
                  <FiGrid className="nav-icon" />
                  <span className="button-text">Dataset</span>
                </button>
                {/* The dropdown menu is no longer rendered here */}
              </div>
            )}

            {onProject && (
              <div className="file-input-wrapper">
                <label htmlFor="files" className="nav-button">
                  <FiUpload className="nav-icon" />
                  <span className="button-text">Choose Files</span>
                </label>
                <input
                  type="file"
                  multiple
                  accept=".kml,.kmz,.zip,.shp,.dwg,.dxf"
                  id="files"
                  className="file-input-hidden"
                  onChange={fileHandler}
                />
              </div>
            )}

            <div className="user-icon-mobile">
              <FiUser className="nav-icon" />
            </div>
            <button
              className="nav-button"
              onClick={() => setShowLogoutModal(true)}
            >
              <FiLogOut className="nav-icon" />
              <span className="button-text">Logout</span>
            </button>
          </div>
        </div>
      </header>

      {/* The Dataset dropdown menu is now rendered here using a Portal */}
      {isDatasetOpen &&
        ReactDOM.createPortal(
          <div
            className="dropdown-menu"
            style={{
              top: `${dropdownPosition.top}px`,
              left: `${dropdownPosition.left}px`,
            }}
          >
            <Link to={`/project/${projectId}/videos`} className="dropdown-item">
              Videos
            </Link>
            <Link to={`/project/${projectId}/photos`} className="dropdown-item">
              Photos
            </Link>
            <Link to={`/project/${projectId}/pano`} className="dropdown-item">
              360 Pano
            </Link>
          </div>,
          document.body // This teleports the menu to the main body tag
        )}

      {/* Logout Confirmation Modal */}
      {showLogoutModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2 className="modal-title">Confirm Logout</h2>
            <p className="modal-description">
              Are you sure you want to log out?
            </p>
            <div className="modal-actions">
              <button
                className="modal-button cancel"
                onClick={() => setShowLogoutModal(false)}
              >
                Cancel
              </button>
              <button className="modal-button confirm" onClick={handleLogout}>
                Logout
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Nav;
