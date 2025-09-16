import React, { useEffect, useRef, useState, useContext } from "react";
import TileLayer from "ol/layer/Tile";
import VectorLayer from "ol/layer/Vector";
import { Map, View, Overlay } from "ol";
import { get as getProjection } from "ol/proj";
import { XYZ } from "ol/source";
import { register } from "ol/proj/proj4";
import proj4 from "proj4";
import { getAnnotationToOrtho } from "../utils/Functions";
import { useParams } from "react-router-dom";
import {
  updateGeoTIFFLayer,
  deserializeFeature,
  createPinFeature,
  createPinOverlay,
  createMeasurementOverlay,
} from "../utils/map";
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
import moment from "moment";
import { getCenter } from "ol/extent";
import { AnnotationsContext } from "../context/Annotations";

// --- NEW HELPER FUNCTION ---
// This function moves the annotation drawing logic here, to the main component.
const loadAnnotationsToSource = (annotations, source, map) => {
  if (!annotations || !source || !map) return;

  source.clear(); // Clear previous annotations before adding new ones

  annotations.forEach(data => {
    // We only handle Line, Polygon, and Pin here as they are vector features.
    // KML/SHP etc. are handled differently as they create their own layers.
    switch (data.type) {
      case "polygon":
      case "line": {
        const feature = deserializeFeature(
          { ...data?.data, featureId: data?.featureId },
          data.type === "polygon"
        );
        source.addFeature(feature);
        const geom = feature?.getGeometry();
        if (geom) {
          const center = getCenter(geom.getExtent());
          const measurementOverlay = createMeasurementOverlay(
            data?.data?.output,
            center,
            data?.featureId
          );
          map.addOverlay(measurementOverlay);
        }
        break;
      }
      case "pin": {
        const pinFeature = createPinFeature(data?.data?.coords);
        if (!pinFeature) return;
        pinFeature?.setId(data?.featureId);
        pinFeature?.set("featureId", data?.featureId);
        pinFeature?.set("label", data?.data?.label || data?.data?.lable);
        source.addFeature(pinFeature);

        const center = pinFeature?.getGeometry()?.getCoordinates();
        const pinOverlay = createPinOverlay(
          data?.data?.label || data?.data?.lable,
          center,
          data?.featureId
        );
        map.addOverlay(pinOverlay);
        break;
      }
      default:
        // KML, SHP, and other file-based layers are handled by AnnotationItemCompare
        // because they add entire new layers, not just features to an existing source.
        break;
    }
  });
};


function Compare() {
  const [sideNavOneVisible, setSideNavOneVisible] = useState(true);
  const [annotation1, setAnnotation1] = useState([]);
  const [annotation2, setAnnotation2] = useState([]);
  const [map, setMap] = useState(null);
  const [source1, setSource1] = useState(null);
  const [source2, setSource2] = useState(null);
  const [orthoLayer1, setOrthoLayer1] = useState(null);
  const [orthoLayer2, setOrthoLayer2] = useState(null);
  const [vectorLayer1, setVectorLayer1] = useState(null);
  const [vectorLayer2, setVectorLayer2] = useState(null);

  const { setOrtho } = useOrthoContext();
  const [side1Width, setSide1Width] = useState(26);
  const { setEditOptions } = useEditOptions();
  const params = useParams();
  const [swipeControl, setSwipeControl] = useState(null);
  const [orientation, setOrientation] = useState("vertical");

  const label1Ref = useRef(null);
  const label2Ref = useRef(null);
  const loadedIds = useRef({ id1: null, id2: null });
  const { addStaticAnnotation } = useContext(AnnotationsContext);


  const fetchProjectData = async () => {
    try {
      const { data } = await axios.get(`${api}/arthouses/project/${params.id}`);
      if (data.length > 0) setOrtho(data);
    } catch (error) {
      console.error("Error fetching project data", error);
    }
  };

  // In Compare.js

  const updateOrthoLayer = async (orthoId, side) => {
    if (!map || !swipeControl || !orthoId) return;

    const isLeftSide = side === 'left';

    // --- DEFINE Z-INDEX VALUES BASED ON SIDE ---
    // Left side layers will be at z-index 1 (ortho) and 2 (annotations).
    // Right side layers will be at z-index 3 (ortho) and 4 (annotations).
    // This ensures the right layer is always drawn ON TOP of the left layer.
    const orthoZIndex = isLeftSide ? 1 : 3;
    const vectorZIndex = isLeftSide ? 2 : 4;

    const oldOrthoLayer = isLeftSide ? orthoLayer1 : orthoLayer2;
    const oldVectorLayer = isLeftSide ? vectorLayer1 : vectorLayer2;

    // Clean up old layers from the map
    if (oldOrthoLayer) map.removeLayer(oldOrthoLayer);
    if (oldVectorLayer) map.removeLayer(oldVectorLayer);

    const setOrthoLayerState = isLeftSide ? setOrthoLayer1 : setOrthoLayer2;
    const setVectorLayerState = isLeftSide ? setVectorLayer1 : setVectorLayer2;
    const setSourceState = isLeftSide ? setSource1 : setSource2;
    const setAnnotationsState = isLeftSide ? setAnnotation1 : setAnnotation2;
    const labelRef = isLeftSide ? label1Ref : label2Ref;

    const newSource = new VectorSource();
    const orthoData = await getAnnotationToOrtho(orthoId);
    if (!orthoData || !orthoData.images || !orthoData.images[0]) {
      console.error(`No image data found for orthoId: ${orthoId}`);
      return;
    }

    // --- PASS THE CORRECT Z-INDEX WHEN CREATING THE LAYER ---
    const newOrthoLayer = await updateGeoTIFFLayer(
      orthoData.images[0],
      map,
      newSource,
      null, // setAnnotationFunction is not used here
      orthoZIndex
    );

    if (!newOrthoLayer) {
      console.error(`Failed to create orthophoto layer for orthoId: ${orthoId}`);
      return;
    }

    // --- SET THE CORRECT Z-INDEX FOR THE VECTOR LAYER ---
    const newVectorLayer = new VectorLayer({
      source: newSource,
      zIndex: vectorZIndex,
    });
    map.addLayer(newVectorLayer);

    loadAnnotationsToSource(orthoData.annotations, newSource, map);

    // The swipe control only needs to manage the RIGHT side layers.
    // It will clip them to reveal the LEFT layers underneath.
    if (!isLeftSide) {
      swipeControl.addLayer(newOrthoLayer, true);
      swipeControl.addLayer(newVectorLayer, true);
    } else {
      // If we are updating the LEFT side, we must ensure the old RIGHT layers are removed
      // from the swipe control's management before being re-added later if needed.
      if (orthoLayer2) swipeControl.removeLayer(orthoLayer2);
      if (vectorLayer2) swipeControl.removeLayer(vectorLayer2);
    }

    // Always ensure the current right-side layers are attached to the swipe control
    if (isLeftSide && orthoLayer2) {
      swipeControl.addLayer(orthoLayer2, true);
      swipeControl.addLayer(vectorLayer2, true);
    }

    setAnnotationsState(orthoData.annotations);
    setSourceState(newSource);
    setOrthoLayerState(newOrthoLayer);
    setVectorLayerState(newVectorLayer);

    if (labelRef.current) {
      labelRef.current.innerHTML = moment(orthoData.date).format("DD-MM-YYYY");
    }
  };

  useEffect(() => {
    const initializeMap = async () => {
      await fetchProjectData();
      proj4.defs("EPSG:4326", "+proj=utm +zone=43 +datum=WGS84 +units=m +no_defs");
      register(proj4);
      const satellite = new TileLayer({
        source: new XYZ({
          url: "https://api.maptiler.com/maps/satellite/{z}/{x}/{y}.jpg?key=MhHCXdXiS76dHZwSbsGf",
        }),
        properties: { base: true }, zIndex: 0,
      });
      const label1Element = document.createElement("div");
      label1Element.className = "ol-control ol-control-unselectable compare-label-left";
      label1Ref.current = label1Element;
      const label2Element = document.createElement("div");
      label2Element.className = "ol-control ol-control-unselectable compare-label-right";
      label2Ref.current = label2Element;
      const olMap = new Map({
        target: "map1", layers: [satellite],
        view: new View({
          projection: getProjection("EPSG:4326"),
          center: [78.9629, 20.5937], zoom: 4,
        }),
        controls: [],
      });
      olMap.addOverlay(new Overlay({ element: label1Element, positioning: 'top-left' }));
      olMap.addOverlay(new Overlay({ element: label2Element, positioning: 'top-right' }));
      const swipe = new Swipe({ orientation: "vertical", className: "ol-swipe" });
      olMap.addControl(swipe);
      setSwipeControl(swipe);
      setMap(olMap);
      setEditOptions();
    };
    initializeMap();
    return () => {
      if (map) map.setTarget(null);
    };
  }, []);

  useEffect(() => {
    const handleUpdates = async () => {
      if (!map || !swipeControl || !params.id1 || !params.id2) return;

      if (params.id1 !== loadedIds.current.id1) {
        await updateOrthoLayer(params.id1, 'left');
        loadedIds.current.id1 = params.id1;
      }
      if (params.id2 !== loadedIds.current.id2) {
        await updateOrthoLayer(params.id2, 'right');
        loadedIds.current.id2 = params.id2;
      }
    };
    handleUpdates();
  }, [params.id1, params.id2, map, swipeControl]);

  const toggleSideNavOne = () => setSideNavOneVisible(!sideNavOneVisible);

  const toggleOrientation = () => {
    if (!swipeControl) return;
    const newOrientation = orientation === "vertical" ? "horizontal" : "vertical";
    swipeControl.set("orientation", newOrientation);
    setOrientation(newOrientation);
  };

  return (
    <div className="compare">
      <CompareNav setEditOptions={() => setEditOptions()} />
      <div className="compare-main">
        {sideNavOneVisible && map && (
          <AnnotationsDivCompare
            a1={annotation1}
            a2={annotation2}
            m1={map}
            m2={map}
            s1={source1}
            s2={source2}
            width={side1Width}
          />
        )}
        <div
          className="collapse-left" id="collapse-left"
          onClick={toggleSideNavOne}
          style={{ left: sideNavOneVisible ? `${side1Width}%` : "0%" }}
        >
          {sideNavOneVisible ? (<i className="fas fa-chevron-left"></i>) : (<i className="fas fa-chevron-right"></i>)}
        </div>
        <div
          id="map1"
          style={{
            height: "calc(100vh - 44px)",
            width: sideNavOneVisible ? `calc(100% - ${side1Width}%)` : "100%",
            position: "relative",
          }}
        >
          <button onClick={toggleOrientation} className="orientation-toggle-btn">
            {orientation === "vertical" ? "Switch to Horizontal" : "Switch to Vertical"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default Compare;