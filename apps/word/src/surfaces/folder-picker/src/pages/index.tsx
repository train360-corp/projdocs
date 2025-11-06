import React from "react";
import { Route, Routes } from "react-router";
import { Clients } from "@workspace/word/surfaces/folder-picker/src/pages/clients";
import { Client } from "@workspace/word/surfaces/folder-picker/src/pages/client";
import { Project } from "@workspace/word/surfaces/folder-picker/src/pages/project";
import { NotFound } from "@workspace/word/surfaces/folder-picker/src/pages/not-found";



export const Pages = () => (
  <Routes>
    <Route
      path={"/dashboard/clients"}
      element={<Clients/>}
    />
    <Route
      path={"/dashboard/clients/:clientID"}
      element={<Client/>}
    />
    <Route
      path={"/dashboard/clients/:clientID/:projectID"}
      element={<Project/>}
    />

    {/* Catch-All Route */}
    <Route
      path={"*"}
      element={<NotFound/>}
    />
  </Routes>
);