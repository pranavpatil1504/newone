import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import App from "./App";
import { BrowserRouter } from "react-router-dom";
import "@fortawesome/fontawesome-free/css/all.min.css";
import { AnnotationsProvider } from "./context/Annotations";
import { MapProvider } from "./context/Map";
import { EditOptionProvider } from "./context/editOptionsDetails";
import { OrhtoProvider } from "./context/OrthoContext";
import { UserProvider } from "./context/UserContext";
import { UnitProvider } from "./context/UnitContext";

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <BrowserRouter>
    <UnitProvider>
      <UserProvider>
        <MapProvider>
          <OrhtoProvider>
            <AnnotationsProvider>
              <EditOptionProvider>
                {/* <React.StrictMode> */}
                <App />
                {/* </React.StrictMode> */}
              </EditOptionProvider>
            </AnnotationsProvider>
          </OrhtoProvider>
        </MapProvider>
      </UserProvider>
    </UnitProvider>
  </BrowserRouter>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
// reportWebVitals();
