import React, { useEffect, useRef, useState } from "react";
import TileLayer from "ol/layer/Tile";
import { Map, View } from "ol";
import { get as getProjection } from "ol/proj";
import { XYZ } from "ol/source";
import { register } from "ol/proj/proj4";
import proj4 from "proj4";
import { getAnnotationToOrtho } from "../utils/Functions";
import { useParams } from "react-router-dom";
import { updateGeoTIFFLayer } from "../utils/map";
import { fetchAnnotationToMap } from "../utils/Compare/annotations";
import AnnotationsDivCompare from "../Components/Compare/Annotation/AnnotationsDivCompare";
import CompareNav from "../Components/Compare/CompareNav";
import "../styles/Compare.css";
import { useOrthoContext } from "../context/OrthoContext";
import { api } from "../config";
import axios from "axios";
import { useEditOptions } from "../context/editOptionsDetails";
import "ol-ext/dist/ol-ext.css";
import Swipe from "ol-ext/control/Swipe";
import VectorSource from "ol/source/Vector";

function Compare() {
  const [sideNavOneVisible, setSideNavOneVisible] = useState(true);
  const [annotation1, setAnnotation1] = useState([]);
  const [annotation2, setAnnotation2] = useState([]);
  const [map, setMap] = useState(null);
  const [source1, setSource1] = useState(null);
  const [source2, setSource2] = useState(null);
  const [orthoLayer1, setOrthoLayer1] = useState(null);
  const [orthoLayer2, setOrthoLayer2] = useState(null);
  const { setOrtho } = useOrthoContext();
  const [side1Width, setSide1Width] = useState(26);
  const containerRef = useRef(null);
  const { setEditOptions } = useEditOptions();
  const params = useParams();
  const [swipeControl, setSwipeControl] = useState(null);
  const [orientation, setOrientation] = useState("vertical");

  const fetchProjectData = async () => {
    try {
      const { data } = await axios.get(`${api}/arthouses/project/${params.id}`);
      if (data.length > 0) setOrtho(data);
    } catch (error) {
      console.error("Error fetching project data", error);
    }
  };

  const loadOrtho = async (id1, id2) => {
    if (!map || !swipeControl) return;

    // Remove previous orthophotos if exist
    if (orthoLayer1) {
      map.removeLayer(orthoLayer1);
      swipeControl.removeLayer(orthoLayer1);
    }
    if (orthoLayer2) {
      map.removeLayer(orthoLayer2);
      swipeControl.removeLayer(orthoLayer2);
    }

    const src1 = new VectorSource();
    const src2 = new VectorSource();

    const a1 = await getAnnotationToOrtho(id1);
    const a2 = await getAnnotationToOrtho(id2);

    // Add orthophotos using original function
    updateGeoTIFFLayer(a1.images[0], map, src1);
    updateGeoTIFFLayer(a2.images[0], map, src2);

    // Load annotations
    fetchAnnotationToMap(map, src1, a1.annotations);
    fetchAnnotationToMap(map, src2, a2.annotations);

    setAnnotation1(a1.annotations);
    setAnnotation2(a2.annotations);
    setSource1(src1);
    setSource2(src2);

    // Get the last two layers added
    const layers = map.getLayers();
    const newOrthoLayer1 = layers.item(layers.getLength() - 2);
    const newOrthoLayer2 = layers.item(layers.getLength() - 1);

    // Add to swipe
    swipeControl.addLayer(newOrthoLayer1);
    swipeControl.addLayer(newOrthoLayer2, true);

    swipeControl.leftLayer = newOrthoLayer1;
    swipeControl.rightLayer = newOrthoLayer2;

    // Save for next removal
    setOrthoLayer1(newOrthoLayer1);
    setOrthoLayer2(newOrthoLayer2);
  };

  useEffect(() => {
    const initializeMap = async () => {
      await fetchProjectData();

      proj4.defs(
        "EPSG:4326",
        "+proj=utm +zone=43 +datum=WGS84 +units=m +no_defs"
      );
      register(proj4);
      const utmProjection = getProjection("EPSG:4326");

      const satellite = new TileLayer({
        source: new XYZ({
          url: "https://api.maptiler.com/maps/satellite/{z}/{x}/{y}.jpg?key=MhHCXdXiS76dHZwSbsGf",
        }),
        properties: { base: true },
      });

      const view = new View({
        projection: utmProjection,
        center: [78.9629, 20.5937],
        zoom: 4,
      });

      const olMap = new Map({
        target: "map1",
        layers: [satellite],
        view,
      });

      // Swipe control
      const swipe = new Swipe({
        orientation: "vertical",
        position: 0.5,
        className: "custom-swipe",
      });
      olMap.addControl(swipe);
      setSwipeControl(swipe);
      setMap(olMap);

      // Swipe handle
      const swipeElement = swipe.element;
      swipeElement.style.position = "relative";
      swipeElement.innerHTML = `<div class="swipe-handle"><span class="swipe-tooltip">Drag to compare</span></div>`;
      const handle = swipeElement.querySelector(".swipe-handle");
      let isDragging = false;

      handle.addEventListener("mousedown", (e) => {
        e.preventDefault();
        isDragging = true;
        document.body.style.userSelect = "none";
      });

      document.addEventListener("mouseup", () => {
        if (!isDragging) return;
        isDragging = false;
        document.body.style.userSelect = "auto";

        // Snap
        let pos = swipe.get("position");
        if (pos < 0.05) pos = 0;
        else if (pos > 0.95) pos = 1;

        const start = swipe.get("position");
        const delta = pos - start;
        const duration = 200;
        const startTime = performance.now();

        function animate(now) {
          const elapsed = now - startTime;
          const t = Math.min(elapsed / duration, 1);
          swipe.set("position", start + delta * t);
          if (t < 1) requestAnimationFrame(animate);
        }
        requestAnimationFrame(animate);
      });

      document.addEventListener("mousemove", (e) => {
        if (!isDragging) return;
        const rect = olMap.getTargetElement().getBoundingClientRect();
        let newPos =
          orientation === "vertical"
            ? (e.clientX - rect.left) / rect.width
            : (e.clientY - rect.top) / rect.height;
        newPos = Math.max(0, Math.min(1, newPos));
        swipe.set("position", newPos);
      });

      // Inject CSS
      const style = document.createElement("style");
      style.innerHTML = `
        .custom-swipe {
          width: 10px !important;
          background: rgba(255,255,255,0.8) !important;
          border-left: 2px solid #0078ff !important;
          border-right: 2px solid #0078ff !important;
          cursor: ew-resize !important;
          z-index: 9999 !important;
        }
        .swipe-handle {
          width: 16px;
          height: 40px;
          background: #0078ff;
          border-radius: 8px;
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          cursor: grab;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .swipe-handle:active { cursor: grabbing; }
        .swipe-tooltip {
          position: absolute;
          bottom: 110%;
          left: 50%;
          transform: translateX(-50%);
          background: rgba(0,0,0,0.7);
          color: white;
          padding: 2px 6px;
          border-radius: 4px;
          font-size: 12px;
          white-space: nowrap;
          opacity: 0;
          transition: opacity 0.2s;
          pointer-events: none;
        }
        .swipe-handle:hover .swipe-tooltip { opacity: 1; }
        .custom-swipe.vertical::after {
          content: "< >";
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          color: #0078ff;
          font-weight: bold;
        }
        .custom-swipe.horizontal::after {
          content: "^ v";
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          color: #0078ff;
          font-weight: bold;
        }
      `;
      document.head.appendChild(style);

      setEditOptions();
    };

    initializeMap();
  }, []);

  // Reload orthos when id1 or id2 changes
  useEffect(() => {
    if (params.id1 && params.id2 && map && swipeControl) {
      loadOrtho(params.id1, params.id2);
    }
  }, [params.id1, params.id2, map, swipeControl]);

  const toggleSideNavOne = () => setSideNavOneVisible(!sideNavOneVisible);

  const toggleOrientation = () => {
    if (!swipeControl) return;
    const newOrientation =
      orientation === "vertical" ? "horizontal" : "vertical";
    swipeControl.set("orientation", newOrientation);
    setOrientation(newOrientation);
    const el = document.querySelector(".custom-swipe");
    if (el) {
      el.classList.remove("vertical", "horizontal");
      el.classList.add(newOrientation);
    }
  };

  return (
    <div className="compare" ref={containerRef}>
      <CompareNav setEditOptions={() => setEditOptions()} />
      <div className="compare-main">
        {sideNavOneVisible && map && (
          <>
            <div
              className="resize-handle left"
              style={{
                height: "calc(-44px + 100vh)",
                left: `${side1Width}%`,
                zIndex: 1,
              }}
            />
            <AnnotationsDivCompare
              a1={annotation1}
              a2={annotation2}
              m1={map}
              m2={map}
              s1={source1}
              s2={source2}
              width={side1Width}
            />
          </>
        )}
        <div
          className="collapse-left"
          id="collapse-left"
          onClick={toggleSideNavOne}
          style={{ left: sideNavOneVisible ? `${side1Width}%` : "0%" }}
        >
          {sideNavOneVisible ? (
            <i className="fas fa-chevron-left"></i>
          ) : (
            <i className="fas fa-chevron-right"></i>
          )}
        </div>
        <button
          onClick={toggleOrientation}
          style={{
            position: "absolute",
            top: "10px",
            left: "50%",
            transform: "translateX(-50%)",
            zIndex: 1000,
            padding: "6px 12px",
            backgroundColor: "#fff",
            border: "1px solid #ccc",
            borderRadius: "6px",
            cursor: "pointer",
            fontWeight: "bold",
          }}
        >
          {orientation === "vertical" ? "Horizontal" : "Vertical"}
        </button>
        <div
          id="map1"
          style={{
            height: "calc(100vh - 44px)",
            width: sideNavOneVisible ? "80vw" : "100vw",
          }}
        />
      </div>
    </div>
  );
}

export default Compare;
