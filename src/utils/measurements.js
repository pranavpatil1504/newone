// import { getLength, getArea } from "ol/sphere.js";

// export function formatLength(line, unit) {
//   const length = getLength(line);
//   if (!length) return "";

//   let output;
//   let convertedLength;

//   switch (unit) {
//     case "kilometers":
//       convertedLength = length / 1000;
//       output = `${convertedLength.toFixed(3)} km`;
//       break;
//     case "miles":
//       convertedLength = length / 1609.34;
//       output = `${convertedLength.toFixed(3)} mi`;
//       break;
//     case "feet":
//       convertedLength = length / 0.3048;
//       output = `${convertedLength.toFixed(2)} ft`;
//       break;
//     case "meters":
//     default:
//       convertedLength = length;
//       output = `${convertedLength.toFixed(2)} m`;
//       break;
//   }
//   return output;
// }

// export function formatArea(polygon, unit) {
//   const area = getArea(polygon);
//   if (!area) return "";

//   let output;
//   let convertedArea;

//   switch (unit) {
//     case "kilometers":
//       convertedArea = area / 1e6;
//       output = `${convertedArea.toFixed(3)} km²`;
//       break;
//     case "miles":
//       convertedArea = area / 2.58999e6;
//       output = `${convertedArea.toFixed(3)} mi²`;
//       break;
//     case "feet":
//       convertedArea = area * 10.7639;
//       output = `${convertedArea.toFixed(2)} ft²`;
//       break;
//     case "acres":
//       convertedArea = area / 4046.86;
//       output = `${convertedArea.toFixed(3)} acres`;
//       break;
//     case "hectares":
//       convertedArea = area / 10000;
//       output = `${convertedArea.toFixed(3)} hectares`;
//       break;
//     case "meters":
//     default:
//       convertedArea = area;
//       output = `${convertedArea.toFixed(2)} m²`;
//       break;
//   }
//   return output;
// }

// // THIS FUNCTION WAS MISSING - ADD IT BACK
// export function convertUnit(value, unit, isArea) {
//   const areaUnits = {
//     meters: " m²",
//     kilometers: " km²",
//     feet: " ft²",
//     miles: " mi²",
//     acres: " acres",
//     hectares: " hectares",
//   };

//   const lengthUnits = {
//     meters: " m",
//     kilometers: " km",
//     feet: " ft",
//     miles: " mi",
//   };

//   const units = isArea ? areaUnits : lengthUnits;
//   const unitSuffix = units[unit];

//   // Ensure value is a string before trying to parse it
//   const valueStr = String(value || "");
//   const numericValue = parseFloat(valueStr.replace(/[^0-9.-]+/g, ""));

//   if (isNaN(numericValue)) {
//     return value; // Return original value if parsing fails
//   }

//   return unitSuffix ? numericValue.toFixed(2) + unitSuffix : value;
// }

import { getLength, getArea } from "ol/sphere";

/**
 * Format length of a line
 */
export function formatLength(line, unit = "meters") {
  if (!line) return "0 m";

  // Always calculate with projection EPSG:3857
  const length = getLength(line, { projection: "EPSG:3857" });
  if (!length) return "0 m";

  let convertedLength;
  switch (unit) {
    case "kilometers":
      convertedLength = length / 1000;
      return `${convertedLength.toFixed(3)} km`;
    case "miles":
      convertedLength = length / 1609.34;
      return `${convertedLength.toFixed(3)} mi`;
    case "feet":
      convertedLength = length / 0.3048;
      return `${convertedLength.toFixed(2)} ft`;
    case "meters":
    default:
      convertedLength = length;
      return `${convertedLength.toFixed(2)} m`;
  }
}

/**
 * Format area of a polygon
 */
export function formatArea(polygon, unit = "meters") {
  if (!polygon) return "0 m²";

  // Always calculate with projection EPSG:3857
  const area = getArea(polygon, { projection: "EPSG:3857" });
  if (!area) return "0 m²";

  let convertedArea;
  switch (unit) {
    case "kilometers":
      convertedArea = area / 1e6;
      return `${convertedArea.toFixed(3)} km²`;
    case "miles":
      convertedArea = area / 2.58999e6;
      return `${convertedArea.toFixed(3)} mi²`;
    case "feet":
      convertedArea = area * 10.7639;
      return `${convertedArea.toFixed(2)} ft²`;
    case "acres":
      convertedArea = area / 4046.86;
      return `${convertedArea.toFixed(3)} acres`;
    case "hectares":
      convertedArea = area / 10000;
      return `${convertedArea.toFixed(3)} hectares`;
    case "meters":
    default:
      convertedArea = area;
      return `${convertedArea.toFixed(2)} m²`;
  }
}

/**
 * Convert unit helper
 */
export function convertUnit(value, unit, isArea = false) {
  const areaUnits = {
    meters: " m²",
    kilometers: " km²",
    feet: " ft²",
    miles: " mi²",
    acres: " acres",
    hectares: " hectares",
  };

  const lengthUnits = {
    meters: " m",
    kilometers: " km",
    feet: " ft",
    miles: " mi",
  };

  const units = isArea ? areaUnits : lengthUnits;
  const unitSuffix = units[unit];

  // Ensure value is a string before trying to parse it
  const valueStr = String(value || "");
  const numericValue = parseFloat(valueStr.replace(/[^0-9.-]+/g, ""));

  if (isNaN(numericValue)) {
    return value; // Return original if parsing fails
  }

  return unitSuffix ? numericValue.toFixed(2) + unitSuffix : value;
}
