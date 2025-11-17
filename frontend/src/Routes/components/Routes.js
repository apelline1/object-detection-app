import React, { lazy, Suspense } from "react";
import { Routes as RouterRoutes, Route, Navigate } from "react-router-dom";

const Video = lazy(() => import("../../Video"));
const Photo = lazy(() => import("../../Photo"));

const Routes = () => (
  <Suspense
    fallback={
      <div className="route-loading">
        <h1>Loading...</h1>
      </div>
    }
  >
    <RouterRoutes>
      <Route path="/" element={<Navigate to="/photo" replace />} />
      <Route path="/photo" element={<Photo />} />
      <Route path="/video" element={<Video />} />
    </RouterRoutes>
  </Suspense>
);

export default Routes;
