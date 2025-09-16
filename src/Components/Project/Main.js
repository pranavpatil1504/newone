import React, { useContext, useEffect, useRef, useState } from "react";
import Annotations from "./Annotations/Annotations.js";
import { ImageTile, Map, Overlay, View } from "ol";
import TileLayer from "ol/layer/Tile";
import { OSM, XYZ } from "ol/source";
import { get as getProjection } from "ol/proj";
import ToolTips from "./ToolTips";
import VectorLayer from "ol/layer/Vector";
import VectorSource from "ol/source/Vector";
import Draw from "ol/interaction/Draw";
import { Fill, Icon, Stroke, Style } from "ol/style";
import { useMap } from "../../context/Map.js";
import { transform } from "ol/proj";
import { register } from "ol/proj/proj4";
import logo from "../../assets/logo-w.png";
import CircleStyle from "ol/style/Circle.js";
import {
  convertUnit,
  fetchFormatArea,
  FetchFormatLength,
  formatArea,
  formatLength,
} from "../../utils/measurements.js";
import SideNav from "./SideNav2/SideNav.js";
import Interaction from "ol/interaction/Interaction.js";
import { Modify, Select, Snap } from "ol/interaction.js";
import { useParams } from "react-router-dom";
import {
  addPin,
  createMeasurementOverlay,
  createPinFeature,
  createPinOverlay,
  deserializeFeature,
  listItemStyleChange,
  handleDrawEnd,
  showMeasumentLabels,
  updateGeoTIFFLayer,
  updateOverlayPosition,
} from "../../utils/map.js";
import { useEditOptions } from "../../context/editOptionsDetails.js";
import { AnnotationsContext } from "../../context/Annotations.js";
import proj4 from "proj4";
import { handleKmlKmzFiles } from "../../utils/File/KmlKmz/KmlKmzFile.js";
import { FetchedhHandleShpFile } from "../../utils/File/ShpShz/FileHandler.js";
import { handleDwgDxfFiles } from "../../utils/File/DXF/DXfFile.js";
import ImageLayer from "ol/layer/Image.js";
import {
  getAnnotationToOrtho,
  removeSelectedStyle,
  serializeFeature,
  serializingPin,
  updateAnnotationFeature,
} from "../../utils/Functions.js";
import GeoJSON from "ol/format/GeoJSON";
import { getCenter } from "ol/extent.js";
import moment from "moment";
import { pointerMove } from "ol/events/condition.js";
const Main = ({ secondNavVisible, toggleSecondNav }) => {
  const [sideNavOneVisible, setSideNavOneVisible] = useState(true);
  const [sideNavTwoVisible, setSideNavTwoVisible] = useState(true);
  // const [secondNavVisible, setSecondNavVisible] = useState(true);
  const { setEditOptions } = useEditOptions();
  const { annotations, addAnnotation, addStaticAnnotation, updateAnnotation } =
    useContext(AnnotationsContext);
  const { map, setMap, setSource, source } = useMap();
  const [draw, setDraw] = useState(null);
  const [drawType, setDrawType] = useState(null);
  const params = useParams();
  const [activeInteraction, setActiveInteraction] = useState();
  const [loading, setLoading] = useState(false);
  const sourceRef = useRef(new VectorSource());
  const containerRef = useRef(null);
  const mapElement = useRef();
  const [side1Width, setSide1Width] = useState(20);
  const [side2Width, setSide2Width] = useState(20);
  const [isDraggingLeft, setIsDraggingLeft] = useState(false);
  const [isDraggingRight, setIsDraggingRight] = useState(false);
  const [selectedTooltip, setSelectedTooltip] = useState("");
  const handleMouseMove = (e) => {
    if (!isDraggingLeft && !isDraggingRight) return;

    const container = containerRef.current;
    if (!container) return;

    const bounds = container.getBoundingClientRect();
    const mouseX = e.clientX - bounds.left;
    const containerWidth = bounds.width;

    if (isDraggingLeft) {
      const fromLeft = containerWidth - mouseX;
      const newWidth = (fromLeft / containerWidth) * 100;
      setSide1Width(Math.min(Math.max(newWidth, 20), 40));
    }
    if (isDraggingRight) {
      const fromRight = containerWidth - mouseX;
      const newWidth = (fromRight / containerWidth) * 100;
      setSide2Width(Math.min(Math.max(newWidth, 20), 40));
    }
  };
  const handleMouseUp = () => {
    setIsDraggingLeft(false);
    setIsDraggingRight(false);
    document.body.style.userSelect = "";
  };
  const handleMouseDownLeft = () => {
    setIsDraggingLeft(true);
    document.body.style.userSelect = "none"; // Disable text selection
  };

  const handleMouseDownRight = () => {
    setIsDraggingRight(true);
    document.body.style.userSelect = "none"; // Disable text selection
  };
  const toggleSideNavOne = () => {
    setSideNavOneVisible(!sideNavOneVisible);
  };

  const toggleSideNavTwo = () => {
    setSideNavTwoVisible(!sideNavTwoVisible);
  };

  // const toggleSecondNav = () => {
  //   document.getElementById("secondnav").style.display = !secondNavVisible
  //     ? "block"
  //     : "none";
  //   setSecondNavVisible(!secondNavVisible);
  // };

  const adjustHeight = secondNavVisible ? "75.7vh" : "89.7vh";

  // const fetchOrtho = async (olMap, sources) => {
  //   try {
  //     const ortho = await getAnnotationToOrtho(params?.orthoId);

  //     // get orthodata and set it on context
  //     localStorage.setItem("orthoId", params?.orthoId);
  //     updateAnnotation(ortho?.annotations);
  //     localStorage.setItem("orthoUrl", ortho.images[0]);
  //     updateGeoTIFFLayer(
  //       ortho.images[0] ?? "",
  //       olMap,
  //       sources,
  //       setAnnotationFuntion
  //     );
  //   } catch (error) {
  //     console.log(error);
  //   }
  // };

  // This is the corrected version
  const fetchOrtho = async (olMap, sources) => {
    try {
      // --- FIX: Add a guard clause to prevent API calls with an invalid ID ---
      if (!params?.orthoId) {
        console.log("fetchOrtho halted: orthoId is not yet available.");
        return null; // Stop the function if the ID is undefined
      }
      // --- END FIX ---

      const ortho = await getAnnotationToOrtho(params.orthoId);

      // Also, add a check to make sure the API returned something valid
      if (ortho && ortho.images) {
        localStorage.setItem("orthoId", params.orthoId);
        updateAnnotation(ortho.annotations);
        localStorage.setItem("orthoUrl", ortho.images[0]);
        updateGeoTIFFLayer(
          ortho.images[0] ?? "",
          olMap,
          sources,
          setAnnotationFuntion
        );
        return ortho.annotations;
      }
    } catch (error) {
      console.log(error);
    }
    return null;
  };

  const reselectFeatureOnLoad = (data) => {
    if (!data) return;

    let options = {};
    const featureId = data.data.id;
    const label = data.data.label || data.data.lable;

    if (data.type === "pin") {
      options = {
        label: label,
        featureID: featureId,
        type: data.type,
        featureData: data.data,
      };
    } else if (["line", "polygon"].includes(data.type)) {
      options = {
        label: label,
        isPolygon: data.type === "polygon",
        featureID: featureId,
        featureData: data.data,
        type: data.type,
      };
    } else {
      // For KML, SHP, etc.
      options = {
        label: label,
        isPolygon: false,
        featureID: featureId,
        type: data.type,
        featureData: data.data,
      };
    }

    setEditOptions(options);

    // Use a timeout to ensure the list item has rendered before trying to style it
    setTimeout(() => {
      listItemStyleChange(featureId);
    }, 0);
  };

  useEffect(() => {
    setLoading(true);
    try {
      // proj4.defs(
      //   "EPSG:4326",
      //   "+proj=utm +zone=43 +datum=WGS84 +units=m +no_defs"
      // );
      // register(proj4);
      if (sourceRef.current) {
        sourceRef.current.clear(); // Clear existing features
      }
      const sources = new VectorSource({
        sources: [
          {
            // url: "https://gisdemo.s3.ap-south-1.amazonaws.com/mahalaxmicog.tif",
          },
        ],
      });

      sourceRef.current = sources;

      const vectorLayer = new VectorLayer({
        source: sources,
        zIndex: 10,

        style: new Style({
          fill: new Fill({
            color: "rgba(68, 138, 255, 0.4)",
          }),
          stroke: new Stroke({
            color: "#448aff",
            width: 2,
          }),
          image: new CircleStyle({
            radius: 7,
            fill: new Fill({
              color: "#448aff",
            }),
          }),
        }),
      });
      vectorLayer.setZIndex(10); // 👈 always on top
      const mapLayer = new TileLayer({
        source: new OSM({}),
        projection: "EPSG:4326",
      });
      mapLayer.set("id", "mapLayer");
      mapLayer.setZIndex(0); // 👈 keep at bottom

      const maptiler = new TileLayer({
        source: new XYZ({
          // url: "https://api.maptiler.com/maps/topo-v2/{z}/{x}/{y}.png?key=8nzRK8UcDsUE8AZWwQh2",
          url: "https://api.maptiler.com/maps/satellite/{z}/{x}/{y}.jpg?key=MhHCXdXiS76dHZwSbsGf",
        }),
      });
      maptiler.set("id", "mapTiler");
      maptiler.setZIndex(1); // 👈 above mapLayer
      const utmProjection = getProjection("EPSG:4326");
      const olMap = new Map({
        target: mapElement.current,
        layers: [mapLayer, maptiler, vectorLayer],
        view: new View({
          projection: utmProjection,
          center: [20.5937, 78.9629],
          zoom: 4,
        }),
      });
      setMap(olMap);
      setSource(sources);

      // --- START: MODIFIED BLOCK ---
      const initializeMapData = async () => {
        const annotationsData = await fetchOrtho(olMap, sources);

        // After all data is loaded, check if an item was previously selected
        if (annotationsData) {
          const selectedId = localStorage.getItem('selectedFeatureId');
          if (selectedId) {
            const selectedAnnotation = annotationsData.find(a => a.data.id === selectedId);
            reselectFeatureOnLoad(selectedAnnotation);
          }
        }
        setLoading(false);
      };

      initializeMapData();
      // --- END: MODIFIED BLOCK ---

      const latLongElement = document.getElementById("lat-long");
      olMap.on("pointermove", (e) => {
        if (e.dragging) {
          return;
        }
        const coords = olMap.getEventCoordinate(e.originalEvent);
        // Transform from the map's current projection to standard Lat/Lon
        const lonLat = transform(coords, olMap.getView().getProjection(), 'EPSG:4326');

        latLongElement.textContent = `Lat ${lonLat[1].toFixed(6)}, Lon ${lonLat[0].toFixed(6)}`;
      });
      olMap.on("click", (e) => {
        if (e.dragging) {
          return;
        }
        const measurementItems = document.querySelectorAll("#measurements li");
        const layerItems = document.querySelectorAll("#layers li");
        [...measurementItems, ...layerItems]?.forEach((item) => {
          // Remove all classes from the item
          item.className = ""; // Removes all existing classes
        });
        setEditOptions();
        removeSelectedStyle(sources);
      });
      fetchOrtho(olMap, sources);
      setLoading(false);
      return () => olMap.setTarget(null);
    } catch (error) {
      setLoading(false);
    }
  }, [setMap, params.orthoId, setSource]);

  const addStaticAnnotationfunc = (data) => {
    addStaticAnnotation(data);
  };
  const tooltip = document.createElement("div");
  tooltip.style.padding = "3px 6px";
  tooltip.style.borderRadius = "3px";
  tooltip.style.backgroundColor = "white";
  tooltip.style.color = "black";
  tooltip.style.textShadow = ` 1px 1px 0 white, -1px -1px 0 white, 1px -1px 0 white, -1px 1px 0 white`;
  const drawLine = new Draw({
    source: source,
    type: "LineString",
    // style: {
    //   "stroke-color": "#448aff",
    //   "stroke-width": 2,
    // },
    // stroke: new Stroke({
    //   color: "#448aff",
    //   width: 0.1, // Set your desired line width here
    // }),
  });
  const drawPolygon = new Draw({
    source: source,
    type: "Polygon",
    // style: {
    //   "stroke-width": 1,
    // },
  });
  const modifyInteraction = new Modify({
    source: sourceRef.current,
    // modifystart: function (event) {},
  });
  const hoverInteraction = new Select({
    condition: pointerMove,
    style: null, // Prevents highlighting on hover
  });

  useEffect(() => {
    if (!map || !modifyInteraction) return;
    if (selectedTooltip != "Cursor") {
      map.addInteraction(hoverInteraction);
      hoverInteraction.on("select", (event) => {
        if (event.selected.length <= 0) return;
        showMeasumentLabels(event.selected[0]?.get("featureId"));
      });
      return;
    }
    // if (!map || !modifyInteraction || selectedTooltip != "Cursor") return;
    map.addInteraction(modifyInteraction);
    // modifyInteraction.on("modifystart", async (event) => {
    //   const features = event.features.getArray();
    //   features?.forEach(async (feature) => {
    //     const featureId = feature.get("featureId");
    //     const element = document.querySelector(
    //       '[overlay-featureId="' + featureId + '"]'
    //     );
    //     if (element) element.style.display = "block";
    //     let lable, center;
    //     if (
    //       !["LineString", "Polygon"].includes(feature.getGeometry().getType())
    //     ) {
    //       lable = feature.get("lable") || feature.get("lable") || "Pin";
    //       center = feature?.getGeometry()?.getCoordinates();
    //     } else {
    //       const geom = feature.getGeometry();
    //       const unit = document.getElementById("unitConversion").value;
    //       const output = formatLength(geom, unit);
    //       lable = output;
    //       center = getCenter(geom.getExtent());
    //     }
    //     updateOverlayPosition(map, featureId, center, lable);
    //   });
    // });
    map.addInteraction(hoverInteraction);
    hoverInteraction.on("select", (event) => {
      if (event.selected.length <= 0) return;
      showMeasumentLabels(event.selected[0]?.get("featureId"));
    });

    modifyInteraction.on("modifyend", async (event) => {
      const features = event.features.getArray();
      features?.forEach(async (feature) => {
        const featureId = feature.get("featureId");
        const isPolygon = feature?.getGeometry().getType() == "Polygon";
        const isPin = feature?.getGeometry().getType() == "Point";
        if (!featureId) {
          console.warn("Feature missing ID:", feature);
          return;
        }
        const element = document.querySelector(
          '[overlay-featureId="' + featureId + '"]'
        );
        if (element) element.style.display = "block";
        let featureData = {};
        if (isPin) {
          const serializing = serializingPin(feature);
          featureData = { ...serializing };
        } else {
          // Get the layer that contains this feature
          const geom = feature.getGeometry();
          const unit = document.getElementById("unitConversion").value;
          const newOutput = isPolygon
            ? formatArea(geom, unit)
            : formatLength(geom, unit);
          const newConvertedOutput = convertUnit(newOutput, unit, isPolygon);

          const serializing = serializeFeature(feature, featureId);

          featureData = {
            ...serializing,
            featureId, // Include featureId in the update data
            lable: feature?.get("lable"),
            geometry: new GeoJSON().writeFeatureObject(feature),
            measurement: newConvertedOutput,
            measurmentValue: newConvertedOutput,
            orthoId: feature.get("orthoId"),
            output: newOutput,
          };
        }
        try {
          // let lable, center;
          // if (isPin) {
          //   lable = feature.get("lable") || feature.get("label") || "Pin";
          //   center = feature?.getGeometry()?.getCoordinates();
          // } else {
          //   const geom = feature.getGeometry();
          //   const unit = document.getElementById("unitConversion").value;
          //   const output = formatLength(geom, unit);
          //   lable = output;
          //   center = getCenter(geom.getExtent());
          // }
          // updateOverlayPosition(map, featureId, center, lable);
          const res = await updateAnnotationFeature(featureId, featureData);
        } catch (error) {
          console.error("Error updating feature:", error);
        }
      });
    });
    // map.removeInteraction(modifyInteraction);

    // Clean up the event listeners when the component unmounts
    // return () => {
    //   modifyInteraction.un("modifystart");
    //   modifyInteraction.un("modifyend");
    // };
  }, [modifyInteraction, map]);
  const editOption = (element) => {
    setEditOptions(element);
  };
  const setAnnotationFuntion = (annot) => {
    addAnnotation(annot);
  };

  const placePin = new Interaction({
    handleEvent: function (e) {
      if (e.type === "click") {
        const coords = map.getEventCoordinate(e.originalEvent);
        const featureID = "feature-" + moment().valueOf();
        const measurementOverlay = createPinOverlay("Pin", coords, featureID);
        map.addOverlay(measurementOverlay);
        showMeasumentLabels(featureID);
        addPin(
          coords,
          map,
          source,
          params.orthoId,
          editOption,
          setAnnotationFuntion,
          addStaticAnnotationfunc,
          featureID
        );
        map.getView().setCenter(coords);
        return false;
      }
      return true;
    },
  });
  const selectInteraction = new Select({
    layers: [],
  });
  document.addEventListener("keydown", function (event) {
    if (event.key === "Escape") {
      setActiveInteractionFunc(selectInteraction);
      if (tooltipOverlay) map?.removeOverlay(tooltipOverlay);
    }
  });
  const snapInteraction = new Snap({ source: source });
  const interactions = {
    line: drawLine,
    polygon: drawPolygon,
    pin: placePin,
    selectInteraction,
  };

  function setActiveInteractionFunc(newInteraction) {
    map?.removeInteraction(activeInteraction);
    map?.addInteraction(newInteraction);
    setActiveInteraction(newInteraction);
  }
  const tooltipOverlay = new Overlay({
    element: tooltip,
    offset: [15, 0],
    positioning: "center-left",
  });
  const measureTooltipElement = document.createElement("div");
  const measureTooltip = new Overlay({
    element: measureTooltipElement,
    offset: [0, -15],
    positioning: "bottom-center",
  });
  drawLine.on("drawstart", function (event) {
    // Create a tooltip for the measurement
    measureTooltipElement.className = "tooltip tooltip-static";
    map.addOverlay(tooltipOverlay);
    // event.feature.setStyle({
    //   stroke: true,
    //   weight: 1,
    // });
    // map.addOverlay(measureTooltip);

    // Change tooltip content dynamically
    event.feature.getGeometry().on("change", function (evt) {
      const unit = document.getElementById("unitConversion").value;
      const geom = evt.target;
      // --- FIX: Transform geometry for live measurement ---
      const geomForMeasurement = geom.clone().transform(map.getView().getProjection(), 'EPSG:3857');
      const output = formatLength(geomForMeasurement, unit);
      const tooltipCoord = geom.getLastCoordinate();
      tooltipOverlay.setPosition(tooltipCoord);
      tooltip.innerHTML = output;
    });
  });
  drawPolygon.on("drawstart", function (event) {
    // Create a tooltip for the measurement
    measureTooltipElement.className = "tooltip tooltip-static";
    map.addOverlay(tooltipOverlay);
    // map.addOverlay(measureTooltip);

    // Change tooltip content dynamically
    event.feature.getGeometry().on("change", function (evt) {
      const unit = document.getElementById("unitConversion").value;
      const geom = evt.target;
      // --- FIX: Transform geometry for live measurement ---
      const geomForMeasurement = geom.clone().transform(map.getView().getProjection(), 'EPSG:3857');
      const output = formatArea(geomForMeasurement, unit);
      const tooltipCoord = geom.getInteriorPoint().getCoordinates();
      tooltipOverlay.setPosition(tooltipCoord);
      tooltip.innerHTML = output;
    });
  });
  drawLine.on("drawend", (event) => {
    const featureID = "feature-" + moment().valueOf();
    // Keep the overlay for the drawn feature
    const geom = event.feature.getGeometry();
    const unit = document.getElementById("unitConversion").value;
    const output = formatLength(geom, unit);
    tooltip.innerHTML = output;
    const center = getCenter(geom.getExtent());
    const measurementOverlay = createMeasurementOverlay(
      output,
      center,
      featureID
    );
    showMeasumentLabels(featureID);
    map.addOverlay(measurementOverlay);
    map.removeOverlay(tooltipOverlay);

    // const coordinates = geom.getLastCoordinate();
    // const measurementOverlay = createMeasurementOverlay(
    //   output,
    //   "Line",
    //   coordinates
    // );
    // map.addOverlay(measurementOverlay);
    handleDrawEnd(
      event,
      false,
      measureTooltip,
      tooltip,
      source,
      map,
      params.orthoId,
      editOption,
      setAnnotationFuntion,
      addStaticAnnotationfunc,
      annotations,
      featureID
    );

    // Add the tooltip as a permanent overlay on the map
  });
  drawPolygon.on("drawend", (event) => {
    const featureID = "feature-" + moment().valueOf();

    // Keep the overlay for the drawn feature
    const geom = event.feature.getGeometry();
    const unit = document.getElementById("unitConversion").value;
    const output = formatArea(geom, unit);
    tooltip.innerHTML = output;
    const center = getCenter(geom.getExtent());
    const measurementOverlay = createMeasurementOverlay(
      output,
      center,
      featureID
    );
    map.addOverlay(measurementOverlay);
    map.removeOverlay(tooltipOverlay);
    showMeasumentLabels(featureID);
    handleDrawEnd(
      event,
      true,
      measureTooltip,
      tooltip,
      source,
      map,
      params.orthoId,
      editOption,
      setAnnotationFuntion,
      addStaticAnnotationfunc,
      annotations,
      featureID
    );

    // Add the tooltip as a permanent overlay on the map
  });

  const clickHandler = (type) => {
    setDrawType(type);
    map.removeOverlay(tooltipOverlay);
    let interaction;
    switch (type) {
      case "Point":
        interaction = interactions.pin;
        break;
      case "Polygon":
        interaction = interactions.polygon;
        break;
      case "LineString":
        interaction = interactions.line;
        break;
      case "Cursor": {
        // interaction = interactions.selectInteraction;
        interaction = modifyInteraction;
      }
      case "Select": {
        // interaction = interactions.selectInteraction;
        interaction = selectInteraction;
      }

      default:
        break;
    }
    setSelectedTooltip(type);
    setActiveInteractionFunc(interaction);
  };

  // if (loading)
  //   return (
  //     <div className="loading-screen">
  //       <img src={logo} alt="loading..." />
  //     </div>
  //   );
  // else {
  return (
    <div
      className="main-content gis"
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      {sideNavOneVisible && (
        <>
          <div
            className="resize-handle left"
            style={{
              left: `${side1Width}%`,
              zIndex: 1,
            }}
            onMouseDown={() => {
              setIsDraggingLeft(true);
              handleMouseDownLeft();
            }}
          />
          <Annotations
            height={secondNavVisible}
            map={map}
            source={source}
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

      {/* <div className="collapse-top" id="collapse-top" onClick={toggleSecondNav}>
        {secondNavVisible ? (
          <i className="fas fa-chevron-left"></i>
        ) : (
          <i className="fas fa-chevron-right"></i>
        )}
      </div> */}
      <div className="collapse-top" id="collapse-top" onClick={toggleSecondNav}>
        {secondNavVisible ? (
          <i className="fas fa-chevron-left"></i>
        ) : (
          <i className="fas fa-chevron-right"></i>
        )}
      </div>

      <ToolTips
        setDrawType={clickHandler}
        width={sideNavTwoVisible ? `${side2Width + 0.5}` : ".5"}
      />

      <div
        ref={mapElement}
        className="map"
        style={{
          height: secondNavVisible
            ? "calc(100vh - 148px)"
            : "calc(100vh - 48px)",
        }}
      ></div>

      <div
        className="collapse-right"
        id="collapse-right"
        onClick={toggleSideNavTwo}
        style={{ right: sideNavTwoVisible ? `${side2Width}%` : "0%" }}
      >
        {sideNavTwoVisible ? (
          <i className="fas fa-chevron-right"></i>
        ) : (
          <i className="fas fa-chevron-left"></i>
        )}
      </div>

      {sideNavTwoVisible && (
        <>
          <div
            className="resize-handle right"
            style={{
              // height: "calc(-148px + 97vh)",
              // width: "4px",
              // background: "gray",
              // position: "absolute",
              right: `${side2Width}%`,
            }}
            onMouseDown={() => {
              setIsDraggingRight(true);
              handleMouseDownRight();
            }}
          />
          <SideNav adjustHeight={secondNavVisible} width={side2Width} />
        </>
      )}
    </div>
  );
  // }
};

export default Main;
