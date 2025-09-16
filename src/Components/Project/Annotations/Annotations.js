import React, { useContext, useEffect, useState } from "react";
import { AnnotationsContext } from "../../../context/Annotations";
import AnnotationItem from "./AnnotationItem";
import { useMap } from "../../../context/Map";

const Annotations = ({ height, map, source, width }) => {
  const { annotations } = useContext(AnnotationsContext);
  const [annotationsList, setAnnotationList] = useState([]);
  const [layerList, setLayerList] = useState([]);
  const [isAnnotationsOpen, setIsAnnotationsOpen] = useState(true); // Accordion for Annotations
  const [isLayersOpen, setIsLayersOpen] = useState(true); // Accordion for Layers

  useEffect(() => {
    // This effect separates the annotations into two lists for rendering.
    const annot = annotations?.filter(
      (e) => !["kml", "kmz", "shp", "shz", "dxf"].includes(e?.type)
    );
    setAnnotationList(annot);
    const layers = annotations?.filter((e) =>
      ["kml", "kmz", "shp", "shz", "dxf"].includes(e?.type)
    );
    setLayerList(layers);
  }, [annotations]);

  // ===================================================================
  // == THIS IS THE CRITICAL FIX: MAP AND STATE SYNCHRONIZATION ========
  // ===================================================================
  // This hook ensures that the OpenLayers map is always a perfect
  // reflection of the `annotations` state array.
  useEffect(() => {
    if (!map || !source) return;

    // Create a Set of all annotation IDs that are supposed to be on the map.
    // A Set provides fast lookups (O(1) time complexity).
    const annotationIdsInState = new Set(annotations.map((a) => a.data.id));

    // --- 1. Reconcile Vector Features (Pins, Lines, Polygons) ---
    const featuresOnMap = source.getFeatures();
    featuresOnMap.forEach((feature) => {
      const featureId = feature.getId();
      // If a feature currently on the map is NOT in our state, remove it.
      if (featureId && !annotationIdsInState.has(featureId)) {
        source.removeFeature(feature);
        
        // Also, find and remove its associated HTML overlay.
        const overlay = map.getOverlayById(`overlay-${featureId}`);
        if (overlay) {
          map.removeOverlay(overlay);
        }
      }
    });

    // --- 2. Reconcile Layers (KML, SHP, DXF, etc.) ---
    const layersOnMap = map
      .getLayers()
      .getArray()
      .filter((layer) => layer.get("layerId")); // Only check layers we manage.

    layersOnMap.forEach((layer) => {
      const layerId = layer.get("layerId");
      // If a layer currently on the map is NOT in our state, remove it.
      if (layerId && !annotationIdsInState.has(layerId)) {
        map.removeLayer(layer);
      }
    });

    // Note: The `AnnotationItem`'s useEffect is still responsible for ADDING items to the map.
    // This effect is the "cleanup crew" that handles REMOVALS.

  }, [annotations, map, source]); // This effect re-runs whenever the state changes.

  return (
    <div
      id="sidebar"
      className="sidebar sidenav1"
      style={{
        height: height ? "calc(100vh - 147px)" : "calc(100vh - 48px)",
        width: `${width}%`,
      }}
    >
      {/* Annotations Accordion */}
      <p
        onClick={() => setIsAnnotationsOpen(!isAnnotationsOpen)}
        style={{ cursor: "pointer" }}
      >
        <i
          className={
            isAnnotationsOpen
              ? "fa-solid fa-chevron-down"
              : "fa-solid fa-chevron-right"
          }
          style={{ fontSize: "16px", marginRight: ".5rem", width: "16px" }}
        ></i>{" "}
        Annotations
      </p>
      {isAnnotationsOpen && (
        <ul id="measurements" style={{ marginTop: ".5rem" }}>
          {annotationsList?.map((e, i) => (
            <AnnotationItem
              data={e}
              index={i}
              key={e.data.id} // Using a stable ID for the key is better for React
              map={map}
              source={source}
            />
          ))}
        </ul>
      )}

      {/* Layers Accordion */}
      <p
        onClick={() => setIsLayersOpen(!isLayersOpen)}
        style={{ cursor: "pointer", marginTop: ".5rem" }}
      >
        <i
          className={
            isLayersOpen
              ? "fa-solid fa-chevron-down"
              : "fa-solid fa-chevron-right"
          }
          style={{ fontSize: "16px", marginRight: ".5rem", width: "16px" }}
        ></i>{" "}
        Layers
      </p>
      {isLayersOpen && (
        <ul id="layers" style={{ marginTop: ".5rem" }}>
          {layerList?.map((e, i) => (
            <AnnotationItem
              data={e}
              index={i}
              key={e.data.id} // Using a stable ID for the key
              map={map}
              source={source}
            />
          ))}
        </ul>
      )}
    </div>
  );
};

export default Annotations;