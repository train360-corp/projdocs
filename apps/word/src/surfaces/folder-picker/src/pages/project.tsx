import { createClient } from "@workspace/supabase/client";
import { useNavigate, useParams } from "react-router";
import React from "react";
import { ProjectPage } from "@workspace/ui/pages/project";



export const Project = () => {

  const supabase = createClient();
  const navigate = useNavigate();
  const params = useParams();

  return (
    <ProjectPage
      navigate={navigate}
      supabase={supabase}
      clientID={params.clientID ?? ""}
      projectID={params.projectID ?? ""}
    />
  );

};