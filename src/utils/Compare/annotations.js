import { handleDwgDxfFiles } from "../File/DXF/DXfFile";
import { handleKmlKmzFiles } from "../File/KmlKmz/KmlKmzFile";
import { FetchedhHandleShpFile } from "../File/ShpShz/FileHandler";
import { createPinFeature, deserializeFeature } from "../map";

export const fetchAnnotationToMap = (map, source, annotations) => {
  annotations?.map((data) => {
    switch (data.type) {
      case "polygon":
      case "line": {
        const feature = deserializeFeature(
          { ...data?.data, featureId: data?.featureId },
          data.type === "Polygon" || data.type === "polygon"
        );
        source.addFeature(feature);
        break;
      }
      case "pin": {
        const pinFeature = createPinFeature(data?.data?.coords);
        if (!pinFeature) return;
        pinFeature?.setId(data?.featureId);
        source?.addFeature(pinFeature);
        break;
      }
      case "kml":
      case "kmz": {
        handleKmlKmzFiles(
          null,
          data?.data?.url,
          map,
          true,
          data?.data?.id,
          data?.data?.lable,
          () => {},
          source,
          () => {}
        );
        break;
      }
      case "shp":
      case "shz": {
        FetchedhHandleShpFile(
          map,
          data?.data?.url,
          data?.data?.id,
          data?.data?.lable,
          () => {},
          source,
          () => {}
        );
        break;
      }
      case "dxf": {
        handleDwgDxfFiles(
          null,
          map,
          data?.data?.url,
          data?.data?.id,
          data?.data?.lable,
          () => {},
          source,
          () => {}
        );
        break;
      }
      default:
        console.log("Unsupported file type:", data?.type);
    }
  });
};
